from grilops import Point
from typing import Dict, NamedTuple, Set


class Symbol(NamedTuple):

    style: int
    shape: str


class Puzzle(object):

    def __init__(
            self,
            width: int = -1,
            height: int = -1,
            symbols: Dict[Point, Symbol] = None,
            texts: Dict[Point, str] = None,
            vertical_lines: Set[Point] = None,
            horizontal_lines: Set[Point] = None,
            vertical_borders: Set[Point] = None,
            horizontal_borders: Set[Point] = None,
    ):
        self.width = width
        self.height = height
        self.texts = texts or {}
        self.symbols = symbols or {}
        # Contains (y, x) if there is a line from (y, x) to (y+1, x)
        self.vertical_lines = vertical_lines or set()
        # Contains (y, x) if there is a line from (y, x) to (y, x+1)
        self.horizontal_lines = horizontal_lines or set()
        # Contains (y,x) if square (y,x) has a right border
        self.vertical_borders = vertical_borders or set()
        # Contains (y,x) if square (y,x) has a bottom border
        self.horizontal_borders = horizontal_borders or set()
