from typing import Dict, List, NamedTuple, Set, Tuple, Union

from grilops import Direction, Point, SymbolGrid

from lib import Directions
from lib.union_find import UnionFind


class Symbol(NamedTuple):

    style: Union[int, List[int]]
    shape: str

    def is_black(self):
        return self.style == 2


class Symbols:

    X = Symbol(0, 'star')
    STAR = Symbol(2, 'star')
    LIGHT_BULB = Symbol(3, 'sun_moon')
    BOMB = Symbol(4, 'sun_moon')
    TREE = Symbol(1, 'tents')
    TENT = Symbol(2, 'tents')


class Puzzle(object):

    def __init__(
            self,
            width: int = -1,
            height: int = -1,
            parameters: Dict[str, str] = None,
            top_space: int = -1,
            bottom_space: int = -1,
            left_space: int = -1,
            right_space: int = -1,
            shaded: Dict[Point, bool] = None,
            texts: Dict[Point, str] = None,
            edge_texts: Dict[Tuple[Point, Direction], str] = None,
            symbols: Dict[Point, Symbol] = None,
            vertical_lines: Dict[Point, Union[bool, int]] = None,
            horizontal_lines: Dict[Point, Union[bool, int]] = None,
            vertical_borders: Dict[Point, Union[bool, Symbol]] = None,
            horizontal_borders: Dict[Point, Union[bool, Symbol]] = None,
    ):
        self.width = width
        self.height = height
        # Arbitrary additional parameters needed to solve the puzzle
        self.parameters = parameters
        self.top_space = top_space
        self.bottom_space = bottom_space
        self.left_space = left_space
        self.right_space = right_space
        self.shaded = shaded or {}
        self.texts = texts or {}
        # Text on an edge, for example ((y, x), NE) is the text in the top right corner of square (y, x)
        self.edge_texts = edge_texts or {}
        self.symbols = symbols or {}
        # Contains (y, x) if there is a line from (y, x) to (y+1, x)
        self.vertical_lines = vertical_lines or {}
        # Contains (y, x) if there is a line from (y, x) to (y, x+1)
        self.horizontal_lines = horizontal_lines or {}
        # Contains (y,x) if square (y,x) has a left border
        self.vertical_borders = vertical_borders or {}
        # Contains (y,x) if square (y,x) has a top border
        self.horizontal_borders = horizontal_borders or {}

    def to_regions(self, points):
        uf = UnionFind()
        for p in points:
            if p not in self.vertical_borders:
                uf.union(Point(p.y, p.x - 1), p)
            if p not in self.horizontal_borders:
                uf.union(Point(p.y - 1, p.x), p)
        return set([tuple(q for q in points if uf.find(q) == p) for p in points if uf.find(p) == p])

    def set_loop(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        for p in sg.lattice.points:
            name = sg.symbol_set.symbols[solved_grid[p]].name
            if 'S' in name:
                self.vertical_lines[p] = True
            if 'E' in name:
                self.horizontal_lines[p] = True

    def set_regions(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        for p in sg.lattice.points:
            for v, borders in [(Directions.W, self.vertical_borders), (Directions.N, self.horizontal_borders)]:
                q = p.translate(v)
                if q in sg.lattice.points and solved_grid[p] != solved_grid[q]:
                    borders[p] = True
