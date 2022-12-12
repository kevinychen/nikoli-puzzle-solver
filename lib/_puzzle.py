from typing import Dict, List, NamedTuple, Set, Tuple, Union

from grilops import Direction, Lattice, Point, SymbolGrid

from lib._directions import Directions
from lib._union_find import UnionFind


class Symbol(NamedTuple):

    style: Union[int, List[int]]
    shape: str

    def is_black(self):
        return self.style == 2

    def is_circle(self):
        return self.shape.startswith('circle_')

    def to_arrow(self) -> Direction:
        directions = (Directions.E, Directions.S, Directions.W, Directions.N,
                      Directions.W, Directions.N, Directions.E, Directions.S)
        assert self.shape.startswith('arrow_fouredge_')
        return dict(zip(self.style, directions))[1]


class Symbols:

    WATER = Symbol(7, 'battleship_B')
    BLACK_CIRCLE = Symbol(2, 'circle_L')
    WHITE_CIRCLE = Symbol(8, 'circle_L')
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
            symbols: Dict[Point, Symbol] = None,
            edge_texts: Dict[Tuple[Point, Direction], str] = None,
            borders: Dict[Tuple[Point, Direction], Union[bool, Symbol]] = None,
            lines: Dict[Tuple[Point, Direction], Union[bool, int]] = None,
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
        self.symbols = symbols or {}

        # Text on an edge, for example ((y,x), NE) is the text in the top right corner of square (y, x)
        self.edge_texts = edge_texts or {}

        # For example, ((y,x), N) means the point (y,x) has a top border.
        # In the original puzzle, both directions will be given, but only one needs to be specified in the solution.
        # As a special case, an object at a corner of a square grid is represented using a diagonal direction.
        # For example, ((y,x), NE) means a symbol on the top right of (y,x). All four directions will be given.
        self.borders = borders or {}

        # Contains ((y,x), dir) if there is a line going through borders[(y,x), dir]
        self.lines = lines or {}

    def border_lines(self, *directions: Direction) -> List[Tuple[Point, Direction]]:
        border_lines = [
            *[(Point(i, -1), Directions.E) for i in range(self.height)],
            *[(Point(i, self.width), Directions.W) for i in range(self.height)],
            *[(Point(-1, i), Directions.S) for i in range(self.width)],
            *[(Point(self.height, i), Directions.N) for i in range(self.width)],
        ]
        return [line for line in border_lines if line[1] in directions]

    def get_regions(self, lattice: Lattice) -> Set[Tuple[Point]]:
        uf = UnionFind()
        for p in lattice.points:
            for v in lattice.edge_sharing_directions():
                if p.translate(v) in lattice.points and (p, v) not in self.borders:
                    uf.union(p, p.translate(v))
        return set([tuple(q for q in lattice.points if uf.find(q) == p) for p in lattice.points if uf.find(p) == p])

    def in_bounds(self, p: Point) -> bool:
        return 0 <= p.y < self.height and 0 <= p.x < self.width

    def set_loop(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        for p in sg.grid:
            for v in sg.lattice.edge_sharing_directions():
                if solved_grid[p] in sg.symbol_set.symbols_for_direction(v):
                    self.lines[p, v] = True

    def set_regions(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        for p in sg.grid:
            for v in sg.lattice.edge_sharing_directions():
                if solved_grid[p] != solved_grid.get(p.translate(v)):
                    self.borders[p, v] = True
