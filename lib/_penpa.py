from base64 import b64decode, b64encode
from functools import reduce
from itertools import accumulate
from json import dumps, loads
from typing import Dict, List, NamedTuple, Tuple
from zlib import compress, decompress

from grilops import Point, Vector

from lib._directions import Directions
from lib._lattice_type import LatticeType, LatticeTypes
from lib._puzzle import Puzzle, Solution, Symbol


class PenpaPart:
    def __init__(
        self,
        killercages: List[List[int]] = None,
        line: Dict[str, int] = None,
        lineE: Dict[str, int] = None,
        number: Dict[str, Tuple[str, int, str]] = None,
        numberS: Dict[str, Tuple[str, int]] = None,
        surface: Dict[str, int] = None,
        symbol: Dict[str, Tuple[int, str, int]] = None,
        **_kwargs,
    ):
        self.arrows = []
        self.direction = []
        self.killercages = killercages or []
        self.line = line or {}
        self.lineE = lineE or {}
        self.number = number or {}
        self.numberS = numberS or {}
        self.squareframe = []
        self.surface = surface or {}
        self.symbol = symbol or {}
        self.thermo = []


class Penpa(NamedTuple):

    lattice_type: LatticeType
    width: int
    height: int
    points: List[int]
    parameters: Dict[str, str]
    top_space: int
    bottom_space: int
    left_space: int
    right_space: int
    q: PenpaPart
    parts: List[str]

    @staticmethod
    def from_url(url: str, parameters: str):
        parts = decompress(b64decode(url[len(PENPA_PREFIX) :]), -15).decode().split("\n")
        header = parts[0].split(",")

        if header[0] in ("square", "sudoku"):
            lattice_type = LatticeTypes.SQUARE
            top_space, bottom_space, left_space, right_space = loads(parts[1])
            width = int(header[1]) - left_space - right_space
            height = int(header[2]) - top_space - bottom_space
        elif header[0] == "hex":
            lattice_type = LatticeTypes.HEXAGON
            top_space, bottom_space, left_space, right_space = loads(parts[1]) * 4
            width = int(header[1])
            height = int(header[2])
        else:
            assert False

        return Penpa(
            lattice_type=lattice_type,
            width=width,
            height=height,
            points=list(accumulate(loads(parts[5]))),
            parameters=dict(
                (k.strip(), v.strip())
                for (k, v) in [line.split(":", 1) for line in (parameters or "").split("\n") if ":" in line]
            ),
            top_space=top_space,
            bottom_space=bottom_space,
            left_space=left_space,
            right_space=right_space,
            q=PenpaPart(**loads(reduce(lambda s, abbr: s.replace(abbr[1], abbr[0]), PENPA_ABBREVIATIONS, parts[3]))),
            parts=parts,
        )

    def to_puzzle(self) -> Puzzle:
        puzzle = Puzzle(
            lattice_type=self.lattice_type,
            width=self.width,
            height=self.height,
            points=set([self._from_index(index)[0] for index in self.points]),
            parameters=self.parameters,
        )
        for index, surface in self.q.surface.items():
            puzzle.shaded[self._from_index(index)[0]] = surface
        for index, _ in self.q.lineE.items():
            (p, category), (q, _) = map(lambda i: self._from_index(i), index.split(","))
            if self.lattice_type == LatticeTypes.SQUARE:
                # An edge is labeled by its two endpoints. Each endpoint vertex is labeled by the coordinate of the
                # square with it as its bottom right corner. So it is at (y+.5,x+.5), but we double the coordinates so
                # that we work in integers. We then rotate the difference vector about one of its endpoints by ±45º
                # (with a scale factor of 1/√2, or 1/2 since we're in doubled space) to get the squares on both sides.
                p, q = Point(2 * p.y + 1, 2 * p.x + 1), Point(2 * q.y + 1, 2 * q.x + 1)
                dy, dx = q.y - p.y, q.x - p.x
                p, q = (
                    Point((p.y + (dy - dx) // 2) // 2, (p.x + (dy + dx) // 2) // 2),
                    Point((p.y + (dy + dx) // 2) // 2, (p.x + (-dy + dx) // 2) // 2),
                )
            elif self.lattice_type == LatticeTypes.HEXAGON:
                # For the hexagonal grid, each vertex is labeled by the hexagon that has it as either its bottom corner
                # or bottom left corner. So they are at (y+1/3,x-1) and (y+2/3,x) in doubled coordinates, and this time
                # we triple the coordinates to work in integers. Each edge connects one vertex of each category, and
                # if the vertex with the second category is given first, we swap them first for convenience. Everything
                # else is the same, just with a different rotation angle and scale factor.
                if category == 1:
                    p, q = q, p
                p, q = Point(3 * p.y + 1, p.x - 1), Point(3 * q.y + 2, q.x)
                dy, dx = q.y - p.y, q.x - p.x
                p, q = (
                    Point((p.y + (dy - 3 * dx) // 2) // 3, p.x + (dy + dx) // 2),
                    Point((p.y + (dy + 3 * dx) // 2) // 3, p.x + (-dy + dx) // 2),
                )
            puzzle.junctions[frozenset((p, q))] = True
        for index, (text, _, _) in self.q.number.items():
            puzzle.texts[self._from_index(index)[0]] = int(text) if type(text) == str and text.isnumeric() else text
        for index, (text, _) in self.q.numberS.items():
            p, category = self._from_index(int(index) // 4)
            v = (
                (Directions.N, Directions.E, Directions.W, Directions.S)
                if category == 2
                else (Directions.NW, Directions.NE, Directions.SW, Directions.SE)
            )[int(index) % 4]
            puzzle.edge_texts[p, v] = int(text) if type(text) == str and text.isnumeric() else text
        for index, (style, shape, _) in self.q.symbol.items():
            p, category = self._from_index(index)
            if category == 0:
                puzzle.symbols[p] = Symbol(style, shape)
            elif category == 1:
                regions = p, p.translate(Directions.E), p.translate(Directions.S), p.translate(Directions.SE)
                puzzle.junctions[frozenset(regions)] = Symbol(style, shape)
            elif category == 2:
                puzzle.junctions[frozenset((p, p.translate(Directions.S)))] = Symbol(style, shape)
            elif category == 3:
                puzzle.junctions[frozenset((p, p.translate(Directions.E)))] = Symbol(style, shape)
        for cage in self.q.killercages:
            if cage:
                puzzle.cages.append([self._from_index(index)[0] for index in cage])
        return puzzle

    def to_url(self, solution: Solution):
        a = PenpaPart()
        for p in solution.shaded:
            a.surface[self._to_index(p)] = 1
        for p, text in solution.texts.items():
            a.number[self._to_index(p)] = str(text), 2, "1"
        for p, symbol in solution.symbols.items():
            a.symbol[self._to_index(p)] = symbol.style, symbol.shape, 2
        for p, q, *_ in solution.junctions:
            dy, dx = q.y - p.y, q.x - p.x
            # Do the reverse of the transformations of lineE done in to_puzzle.
            if self.lattice_type == LatticeTypes.SQUARE:
                p, q = (Point(2 * p.y + dy - dx, 2 * p.x + dy + dx), Point(2 * p.y + dy + dx, 2 * p.x - dy + dx))
                index1, index2 = (
                    self._to_index(Point(p.y // 2, p.x // 2), 1),
                    self._to_index(Point(q.y // 2, q.x // 2), 1),
                )
            elif self.lattice_type == LatticeTypes.HEXAGON:
                p, q = (
                    Point(3 * p.y + (3 * dy - dx) // 2, p.x + (dy + dx) // 2),
                    Point(3 * p.y + (3 * dy + dx) // 2, p.x + (-dy + dx) // 2),
                )
                if p.y % 3 != 1:
                    p, q = q, p
                index1, index2 = (self._to_index(Point(p.y // 3, p.x + 1), 2), self._to_index(Point(q.y // 3, q.x), 1))
            else:
                assert False
            a.lineE[f"{min(index1, index2)},{max(index1, index2)}"] = 3
        for (p, q), line in solution.lines.items():
            index1 = self._to_index(p)
            index2 = self._to_index(q)
            a.line[f"{min(index1, index2)},{max(index1, index2)}"] = 3 if line is True else line
        self.parts[4] = reduce(lambda s, abbr: s.replace(abbr[0], abbr[1]), PENPA_ABBREVIATIONS, dumps(a.__dict__))
        return PENPA_PREFIX + b64encode(compress("\n".join(self.parts).encode())[2:-4]).decode()

    def _from_index(self, index):
        category, num = divmod(int(index), self._w() * self._h())
        p = Point(*divmod(num, self._w()))
        if self.lattice_type == LatticeTypes.HEXAGON:
            # change from odd-r offset coordinates to doubled coordinates
            p = Point(p.y, 2 * p.x + p.y % 2)
        return p.translate(self._v().negate()), category

    def _to_index(self, p, category=0):
        y, x = p.translate(self._v())
        if self.lattice_type == LatticeTypes.HEXAGON:
            # change from doubled offset coordinates to odd-r coordinates
            x //= 2
        return self._w() * self._h() * category + self._w() * y + x

    def _v(self):
        """(0,0) in the puzzle grid is mapped to this point in the Penpa numbering system."""
        if self.lattice_type == LatticeTypes.SQUARE:
            return Vector(2 + self.top_space, 2 + self.left_space)
        elif self.lattice_type == LatticeTypes.HEXAGON:
            y = (self.height * 3 + 1) // 2
            return Vector(y, self.width * 3 // 2 * 2 + y % 2)

    def _w(self):
        if self.lattice_type == LatticeTypes.SQUARE:
            return self.width + 4 + self.left_space + self.right_space
        elif self.lattice_type == LatticeTypes.HEXAGON:
            return self.width * 3 + 1

    def _h(self):
        if self.lattice_type == LatticeTypes.SQUARE:
            return self.height + 4 + self.top_space + self.bottom_space
        elif self.lattice_type == LatticeTypes.HEXAGON:
            return self.height * 3 + 1


PENPA_PREFIX = "m=edit&p="
# Copied from https://github.com/swaroopg92/penpa-edit/blob/v3.0.3/docs/js/class_p.js#L131-L162
PENPA_ABBREVIATIONS = [
    ['"qa"', "z9"],
    ['"pu_q"', "zQ"],
    ['"pu_a"', "zA"],
    ['"grid"', "zG"],
    ['"edit_mode"', "zM"],
    ['"surface"', "zS"],
    ['"line"', "zL"],
    ['"lineE"', "zE"],
    ['"wall"', "zW"],
    ['"cage"', "zC"],
    ['"number"', "zN"],
    ['"symbol"', "zY"],
    ['"special"', "zP"],
    ['"board"', "zB"],
    ['"command_redo"', "zR"],
    ['"command_undo"', "zU"],
    ['"command_replay"', "z8"],
    ['"numberS"', "z1"],
    ['"freeline"', "zF"],
    ['"freelineE"', "z2"],
    ['"thermo"', "zT"],
    ['"arrows"', "z3"],
    ['"direction"', "zD"],
    ['"squareframe"', "z0"],
    ['"polygon"', "z5"],
    ['"deletelineE"', "z4"],
    ['"killercages"', "z6"],
    ['"nobulbthermo"', "z7"],
    ['"__a"', "z_"],
    ["null", "zO"],
]
