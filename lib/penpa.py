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
            symbol: Dict[str, Tuple[int, str, int]] = None,
            **_kwargs,
    ):
        self.line = line or {}
        self.lineE = lineE or {}
        self.number = number or {}
        self.numberS = numberS or {}
        self.squareframe = {}
        self.surface = {}
        self.symbol = symbol or {}


class Penpa(NamedTuple):

    width: int
    height: int
    q: PenpaPart
    parts: List[str]

    def to_puzzle(self) -> Puzzle:
        puzzle = Puzzle(self.width, self.height)
        puzzle.texts = {}
        puzzle.edge_texts = {}
        puzzle.symbols = {}
        for k, (text, _, _) in self.q.number.items():
            p = Point(*divmod(int(k), self.width + 4)).translate(Vector(-2, -2))
            puzzle.texts[p] = text
        for k, (text, _) in self.q.numberS.items():
            kk = int(k) // 4 - (self.width + 4) * (self.height + 4)
            p = Point(*divmod(int(kk), self.width + 4)).translate(Vector(-2, -2))
            puzzle.edge_texts[p, DIAGONAL_DIRECTIONS[int(k) % 4]] = text
        for k, (style, shape, _) in self.q.symbol.items():
            p = Point(*divmod(int(k), self.width + 4)).translate(Vector(-2, -2))
            puzzle.symbols[p] = Symbol(style, shape)
        return puzzle

    def to_url(self, solved: Puzzle):
        a = PenpaPart()
        for p in solved.vertical_lines:
            start = (self.width + 4) * (p.y + 2) + p.x + 2
            a.line[f'{start},{start + self.width + 4}'] = 2
        for p in solved.horizontal_lines:
            start = (self.width + 4) * (p.y + 2) + p.x + 2
            a.line[f'{start},{start + 1}'] = 2
        for p in solved.vertical_borders:
            start = (self.width + 4) * (self.height + 4) + (self.width + 4) * (p.y + 1) + p.x + 1
            a.lineE[f'{start},{start + self.width + 4}'] = 2
        for p in solved.horizontal_borders:
            start = (self.width + 4) * (self.height + 4) + (self.width + 4) * (p.y + 1) + p.x + 1
            a.lineE[f'{start},{start + 1}'] = 2
        for p, text in solved.texts.items():
            a.number[str((p.y + 2) * (self.width + 4) + p.x + 2)] = (text, 2, '1')
        for p, symbol in solved.symbols.items():
            a.symbol[str((p.y + 2) * (self.width + 4) + p.x + 2)] = (symbol.style, symbol.shape, 2)
        self.parts[4] = reduce(
            lambda s, abbr: s.replace(abbr[0], abbr[1]),
            PENPA_ABBREVIATIONS,
            dumps(a.__dict__))
        return PENPA_PREFIX + b64encode(compress('\n'.join(self.parts).encode())[2:-4]).decode()

    @staticmethod
    def from_url(url: str):
        parts = decompress(b64decode(url[len(PENPA_PREFIX):]), -15).decode().split('\n')
        header = parts[0].split(',')
        return Penpa(
            width=int(header[1]),
            height=int(header[2]),
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
