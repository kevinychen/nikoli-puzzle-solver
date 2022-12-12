from base64 import b64decode, b64encode
from functools import reduce
from json import dumps, loads
from typing import Dict, List, NamedTuple, Tuple
from zlib import compress, decompress

from grilops import Point, Vector

from lib._directions import Directions
from lib._puzzle import Puzzle, Symbol


class PenpaPart(object):

    def __init__(
            self,
            line: Dict[str, int] = None,
            lineE: Dict[str, int] = None,
            number: Dict[str, Tuple[str, int, str]] = None,
            numberS: Dict[str, Tuple[str, int]] = None,
            surface: Dict[str, int] = None,
            symbol: Dict[str, Tuple[int, str, int]] = None,
            **_kwargs,
    ):
        self.line = line or {}
        self.lineE = lineE or {}
        self.number = number or {}
        self.numberS = numberS or {}
        self.squareframe = {}
        self.surface = surface or {}
        self.symbol = symbol or {}


class Penpa(NamedTuple):

    width: int
    height: int
    parameters: Dict[str, str]
    top_space: int
    bottom_space: int
    left_space: int
    right_space: int
    q: PenpaPart
    parts: List[str]

    @staticmethod
    def from_url(url: str, parameters: str):
        parts = decompress(b64decode(url[len(PENPA_PREFIX):]), -15).decode().split('\n')
        header = parts[0].split(',')
        top_space, bottom_space, left_space, right_space = loads(parts[1])

        return Penpa(
            width=int(header[1]) - left_space - right_space,
            height=int(header[2]) - top_space - bottom_space,
            parameters=dict((k.strip(), v.strip()) for (k, v) in
                            [line.split(':', 1) for line in (parameters or '').split('\n') if ':' in line]),
            top_space=top_space,
            bottom_space=bottom_space,
            left_space=left_space,
            right_space=right_space,
            q=PenpaPart(**loads(reduce(lambda s, abbr: s.replace(abbr[1], abbr[0]), PENPA_ABBREVIATIONS, parts[3]))),
            parts=parts
        )

    def to_puzzle(self) -> Puzzle:
        puzzle = Puzzle(
            width=self.width,
            height=self.height,
            parameters=self.parameters,
            top_space=self.top_space,
            bottom_space=self.bottom_space,
            left_space=self.left_space,
            right_space=self.right_space,
        )
        for index, surface in self.q.surface.items():
            puzzle.shaded[self._from_index(index)[0]] = surface
        for index, _ in self.q.lineE.items():
            p, q = map(lambda i: self._from_index(i)[0], index.split(','))
            dy, dx = q.y - p.y, q.x - p.x
            p, q = (Point(p.y + (dy - dx + 1) // 2, p.x + (dy + dx + 1) // 2),
                    Point(p.y + (dy + dx + 1) // 2, p.x + (-dy + dx + 1) // 2))
            puzzle.borders[p, next(v for v in Directions.ALL if p.translate(v) == q)] = True
            puzzle.borders[q, next(v for v in Directions.ALL if q.translate(v) == p)] = True
        for index, (text, _, _) in self.q.number.items():
            puzzle.texts[self._from_index(index)[0]] = int(text) if text.isnumeric() else text
        for index, (text, _) in self.q.numberS.items():
            v = [Directions.NW, Directions.NE, Directions.SW, Directions.SE][int(index) % 4]
            puzzle.edge_texts[self._from_index(index)[0], v] = int(text) if text.isnumeric() else text
        for index, (style, shape, _) in self.q.symbol.items():
            p, category = self._from_index(index)
            if category == 0:
                puzzle.symbols[p] = Symbol(style, shape)
            elif category == 1:
                puzzle.borders[p.translate(Directions.SE), Directions.NW] = Symbol(style, shape)
                puzzle.borders[p.translate(Directions.S), Directions.NE] = Symbol(style, shape)
                puzzle.borders[p.translate(Directions.E), Directions.SW] = Symbol(style, shape)
                puzzle.borders[p, Directions.SE] = Symbol(style, shape)
            elif category == 2:
                puzzle.borders[p.translate(Directions.S), Directions.N] = Symbol(style, shape)
                puzzle.borders[p, Directions.S] = Symbol(style, shape)
            elif category == 3:
                puzzle.borders[p.translate(Directions.E), Directions.W] = Symbol(style, shape)
                puzzle.borders[p, Directions.E] = Symbol(style, shape)
        return puzzle

    def to_url(self, solution: Puzzle):
        a = PenpaPart()
        for p in solution.shaded:
            a.surface[self._to_index(p)] = 1
        for p, text in solution.texts.items():
            a.number[self._to_index(p)] = str(text), 2, '1'
        for p, symbol in solution.symbols.items():
            a.symbol[self._to_index(p)] = symbol.style, symbol.shape, 2
        for p, v in solution.borders:
            y, x = v.vector
            index1 = self._to_index(p.translate(Vector((y - x - 1) // 2, (y + x - 1) // 2)), 1)
            index2 = self._to_index(p.translate(Vector((y + x - 1) // 2, (-y + x - 1) // 2)), 1)
            a.lineE[f'{min(index1, index2)},{max(index1, index2)}'] = 3
        for (p, v), line in solution.lines.items():
            index1 = self._to_index(p)
            index2 = self._to_index(p.translate(v))
            a.line[f'{min(index1, index2)},{max(index1, index2)}'] = 3 if line is True else line
        self.parts[4] = reduce(
            lambda s, abbr: s.replace(abbr[0], abbr[1]),
            PENPA_ABBREVIATIONS,
            dumps(a.__dict__))
        return PENPA_PREFIX + b64encode(compress('\n'.join(self.parts).encode())[2:-4]).decode()

    def _from_index(self, index):
        category, num = divmod(int(index), self._w() * self._h())
        if category >= 4:
            category, num = 4, (num + (category - 4) * self._w() * self._h()) // 4
        return Point(*divmod(num, self._w())).translate(Vector(-2 - self.top_space, -2 - self.left_space)), category

    def _to_index(self, p, category=0):
        return self._w() * self._h() * category + self._w() * (p.y + 2 + self.top_space) + p.x + 2 + self.left_space

    def _w(self):
        return self.width + 4 + self.left_space + self.right_space

    def _h(self):
        return self.height + 4 + self.top_space + self.bottom_space


PENPA_PREFIX = 'm=edit&p='
# Copied from https://github.com/swaroopg92/penpa-edit/blob/v3.0.3/docs/js/class_p.js#L131-L162
PENPA_ABBREVIATIONS = [
    ["\"qa\"", "z9"],
    ["\"pu_q\"", "zQ"],
    ["\"pu_a\"", "zA"],
    ["\"grid\"", "zG"],
    ["\"edit_mode\"", "zM"],
    ["\"surface\"", "zS"],
    ["\"line\"", "zL"],
    ["\"lineE\"", "zE"],
    ["\"wall\"", "zW"],
    ["\"cage\"", "zC"],
    ["\"number\"", "zN"],
    ["\"symbol\"", "zY"],
    ["\"special\"", "zP"],
    ["\"board\"", "zB"],
    ["\"command_redo\"", "zR"],
    ["\"command_undo\"", "zU"],
    ["\"command_replay\"", "z8"],
    ["\"numberS\"", "z1"],
    ["\"freeline\"", "zF"],
    ["\"freelineE\"", "z2"],
    ["\"thermo\"", "zT"],
    ["\"arrows\"", "z3"],
    ["\"direction\"", "zD"],
    ["\"squareframe\"", "z0"],
    ["\"polygon\"", "z5"],
    ["\"deletelineE\"", "z4"],
    ["\"killercages\"", "z6"],
    ["\"nobulbthermo\"", "z7"],
    ["\"__a\"", "z_"],
    ["null", "zO"],
]
DIAGONAL_DIRECTIONS = [Directions.NW, Directions.NE, Directions.SW, Directions.SE]
