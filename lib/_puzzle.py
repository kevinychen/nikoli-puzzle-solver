from enum import Enum
from typing import Dict, FrozenSet, List, NamedTuple, Set, Tuple, Union

from grilops import Direction, Lattice, Point, PointyToppedHexagonalLattice, RectangularLattice, SymbolGrid

from lib._directions import Directions
from lib._union_find import UnionFind


class Board(Enum):

    SQUARE = 1,
    HEXAGON = 2,


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
            board: Board = None,
            width: int = -1,
            height: int = -1,
            parameters: Dict[str, str] = None,
            shaded: Dict[Point, bool] = None,
            texts: Dict[Point, str] = None,
            symbols: Dict[Point, Symbol] = None,
            edge_texts: Dict[Tuple[Point, Direction], str] = None,
            junctions: Dict[FrozenSet[Point], Union[bool, Symbol]] = None,
            lines: Dict[FrozenSet[Point], Union[bool, int]] = None,
    ):
        self.board = board
        self.width = width
        self.height = height

        # Arbitrary additional parameters needed to solve the puzzle
        self.parameters = parameters

        self.shaded = shaded or {}
        self.texts = texts or {}
        self.symbols = symbols or {}

        # Text on an edge, for example ((y,x), NE) is the text in the top right corner of (y, x)
        self.edge_texts = edge_texts or {}

        # Any point between two regions of the grid. For example, a key of 2 regions corresponds to the edge between the
        # regions, and can be either a bordering line (if the value is True) or a symbol on that edge.
        # A key of more than 2 regions is a vertex, e.g. each corner of a square grid is a junction of 4 regions.
        self.junctions = junctions or {}

        # Each key is 2 regions, representing a line between the center of those 2 regions in the grid.
        self.lines = lines or {}

        if board == Board.SQUARE:
            self.points = set([Point(y, x) for y in range(height) for x in range(width)])
        elif board == Board.HEXAGON:
            self.points = set([Point(y, x) for y in range(-width + 1, width) for x in range(-2 * width + 2, 2 * width)
                               if abs(y) + abs(x) < 2 * width and (y + x) % 2 == 0])

    def entrance_points(self, lattice: Lattice) -> Set[Tuple[Point, Direction]]:
        """Returns all tuples (p, v) where p is a point right outside the grid, and v is the direction to the grid."""
        points = set()
        for v in lattice.edge_sharing_directions():
            for p in self.points:
                while p in self.points:
                    p = p.translate(v)
                points.add((p, lattice.opposite_direction(v)))
        return points

    def get_lattice(self, border: bool = False) -> Lattice:
        if self.board == Board.SQUARE:
            factory = RectangularLattice
        elif self.board == Board.HEXAGON:
            factory = PointyToppedHexagonalLattice
        else:
            assert False

        lattice = factory(list(self.points))
        if border:
            lattice = factory(list(set([q for p in self.points for q in lattice.vertex_sharing_points(p)])))
        return lattice

    def get_regions(self, lattice: Lattice) -> Set[Tuple[Point]]:
        uf = UnionFind()
        for p in lattice.points:
            for q in lattice.edge_sharing_points(p):
                if q in lattice.points and frozenset((p, q)) not in self.junctions:
                    uf.union(p, q)
        return set([tuple(q for q in lattice.points if uf.find(q) == p) for p in lattice.points if uf.find(p) == p])

    def set_loop(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        for p in sg.grid:
            for v in sg.lattice.edge_sharing_directions():
                if solved_grid[p] in sg.symbol_set.symbols_for_direction(v):
                    self.lines[frozenset((p, p.translate(v)))] = True

    def set_regions(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        for p in sg.grid:
            for q in sg.lattice.edge_sharing_points(p):
                if solved_grid[p] != solved_grid.get(q):
                    self.junctions[frozenset((p, q))] = True
