from base64 import b64decode, b64encode
from functools import reduce
from json import dumps, loads
from typing import Dict, List, NamedTuple, Tuple
from zlib import compress, decompress

from grilops import Point, Vector

from lib.directions import Directions
from lib.puzzle import Puzzle, Symbol


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
    parameters: str
    top_space: int
    bottom_space: int
    left_space: int
    right_space: int
    q: PenpaPart
    parts: List[str]

    @property
    def w(self):
        return self.width + 4 + self.left_space + self.right_space

    @property
    def h(self):
        return self.height + 4 + self.top_space + self.bottom_space

    @property
    def v(self):
        return Vector(2 + self.top_space, 2 + self.left_space)

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
        for k, _ in self.q.surface.items():
            p = Point(*divmod(int(k), self.w)).translate(self.v.negate())
            puzzle.shaded.add(p)
        for k, _ in self.q.lineE.items():
            num1, num2 = map(lambda kp: int(kp) - self.w * self.h + self.w + 1, k.split(','))
            p = Point(*divmod(num1, self.w)).translate(self.v.negate())
            if num2 - num1 == self.w:
                puzzle.vertical_borders.add(p)
            elif num2 - num1 == 1:
                puzzle.horizontal_borders.add(p)
        for k, (text, _, _) in self.q.number.items():
            p = Point(*divmod(int(k), self.w)).translate(self.v.negate())
            puzzle.texts[p] = text
        for k, (text, _) in self.q.numberS.items():
            kk = int(k) // 4 - self.w * self.h
            p = Point(*divmod(int(kk), self.w)).translate(self.v.negate())
            puzzle.edge_texts[p, DIAGONAL_DIRECTIONS[int(k) % 4]] = text
        for k, (style, shape, _) in self.q.symbol.items():
            p = Point(*divmod(int(k), self.w)).translate(self.v.negate())
            puzzle.symbols[p] = Symbol(style, shape)
        return puzzle

    def to_url(self, solved: Puzzle):
        a = PenpaPart()
        for p in solved.shaded:
            y, x = p.translate(self.v)
            a.surface[str(self.w * y + x)] = 1
        for p, text in solved.texts.items():
            y, x = p.translate(self.v)
            a.number[str(self.w * y + x)] = str(text), 2, '1'
        for p, symbol in solved.symbols.items():
            y, x = p.translate(self.v)
            a.symbol[str(self.w * y + x)] = symbol.style, symbol.shape, 2
        for p in solved.vertical_lines:
            y, x = p.translate(self.v)
            start = self.w * y + x
            a.line[f'{start},{start + self.w}'] = 2
        for p in solved.horizontal_lines:
            y, x = p.translate(self.v)
            start = (self.width + 4) * y + x
            a.line[f'{start},{start + 1}'] = 2
        for p in solved.vertical_borders:
            y, x = p.translate(self.v)
            start = self.w * self.h - self.w - 1 + self.w * y + x
            a.lineE[f'{start},{start + self.w}'] = 2
        for p in solved.horizontal_borders:
            y, x = p.translate(self.v)
            start = self.w * self.h - self.w - 1 + self.w * y + x
            a.lineE[f'{start},{start + 1}'] = 2
        self.parts[4] = reduce(
            lambda s, abbr: s.replace(abbr[0], abbr[1]),
            PENPA_ABBREVIATIONS,
            dumps(a.__dict__))
        return PENPA_PREFIX + b64encode(compress('\n'.join(self.parts).encode())[2:-4]).decode()

    @staticmethod
    def from_url(url: str, parameters: str):
        parts = decompress(b64decode(url[len(PENPA_PREFIX):]), -15).decode().split('\n')
        header = parts[0].split(',')
        top_space, bottom_space, left_space, right_space = loads(parts[1])

        return Penpa(
            width=int(header[1]) - left_space - right_space,
            height=int(header[2]) - top_space - bottom_space,
            parameters=dict(map(lambda s: s.strip(), line.split(':', 1))
                            for line in parameters.split('\n') if ':' in line) if parameters else {},
            top_space=top_space,
            bottom_space=bottom_space,
            left_space=left_space,
            right_space=right_space,
            q=PenpaPart(**loads(reduce(lambda s, abbr: s.replace(abbr[1], abbr[0]), PENPA_ABBREVIATIONS, parts[3]))),
            parts=parts
        )


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
