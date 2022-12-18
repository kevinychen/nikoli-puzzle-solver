from abc import ABC
from typing import Callable, Dict, FrozenSet, List, NamedTuple, Set, Tuple, Union

from grilops import Direction, Lattice, Point, SymbolGrid, Vector
from grilops.shapes import Shape

from lib._directions import Directions
from lib._lattice_type import LatticeType
from lib._union_find import UnionFind


class Symbol(NamedTuple):

    style: Union[int, List[int]]
    shape: str

    def get_arrows(self) -> List[Direction]:
        if self.shape.startswith("arrow_fouredge_"):
            directions = (
                Directions.E,
                Directions.S,
                Directions.W,
                Directions.N,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
            )
        elif self.shape == "arrow_cross":
            directions = Directions.W, Directions.N, Directions.E, Directions.S
        elif self.shape == "arrow_S" or self.shape.startswith("arrow_N_"):
            directions = (
                None,
                Directions.W,
                Directions.SW,
                Directions.N,
                Directions.NE,
                Directions.E,
                Directions.SE,
                Directions.S,
                Directions.SW,
            )
        elif self.shape == "inequality":
            directions = (
                None,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
            )
        else:
            assert False
        if type(self.style) == int:
            return [directions[self.style]]
        else:
            return [v for v, flag in zip(directions, self.style) if flag]

    def is_black(self):
        return self.style == 2

    def is_circle(self):
        return self.shape.startswith("circle_")


class Symbols:

    WATER = Symbol(7, "battleship_B")
    BLACK_CIRCLE = Symbol(2, "circle_L")
    WHITE_CIRCLE = Symbol(8, "circle_L")
    X = Symbol(0, "star")
    STAR = Symbol(2, "star")
    LIGHT_BULB = Symbol(3, "sun_moon")
    BOMB = Symbol(4, "sun_moon")
    TREE = Symbol(1, "tents")
    TENT = Symbol(2, "tents")


class AbstractPuzzle(ABC):
    def __init__(self):
        self.shaded: Dict[Point, Union[bool, int]] = {}
        self.texts: Dict[Point, Union[int, str]] = {}
        self.symbols: Dict[Point, Symbol] = {}

        # Text on an edge, for example ((y,x), NE) is the text in the top right corner of (y, x)
        self.edge_texts: Dict[Tuple[Point, Direction], Union[int, str]] = {}

        # Any point between two cells of the grid. For example, a key of 2 cells corresponds to the edge between the
        # cells, and can be either a bordering line (if the value is True) or a symbol on that edge.
        # A key of more than 2 cells is a vertex, e.g. each corner of a square grid is a junction of 4 cells.
        self.junctions: Dict[FrozenSet[Point], Union[bool, Symbol]] = {}

        # Each key is 2 cells, representing a line between the center of those 2 cells in the grid.
        self.lines: Dict[FrozenSet[Point], Union[bool, int]] = {}

        # Each cage is a region of contiguous cells surrounded by dotted lines.
        self.cages: List[List[Point]] = []

        # Each thermo represents a region of cells ordered from bulb to flat part
        self.thermo: List[List[Point]] = []


class Puzzle(AbstractPuzzle):
    def __init__(
        self, lattice_type: LatticeType, width: int, height: int, points: Set[Point], parameters: Dict[str, str]
    ):
        super().__init__()

        self.lattice_type = lattice_type
        self.width = width
        self.height = height
        self.points = points

        # Arbitrary additional parameters needed to solve the puzzle
        self.parameters = parameters

    def edges(self, include_diagonal=False) -> List[Tuple[Point, Point]]:
        f: Callable[[Point], List[Point]] = (
            self.lattice_type.vertex_sharing_points if include_diagonal else self.lattice_type.edge_sharing_points
        )
        return [(p, q) for p in self.points for q in f(p) if q in self.points]

    def entrance_points(self) -> Set[Tuple[Point, Direction]]:
        """Returns all tuples (p, v) where p is a point right outside the grid, and v is the direction to the grid."""
        points = set()
        for v in self.lattice_type.edge_sharing_directions():
            for p in self.points:
                while p in self.points:
                    p = p.translate(v)
                points.add((p, self.lattice_type.opposite_direction(v)))
        return points

    def lattice(self, border: bool = False) -> Lattice:
        points = self.points
        if border:
            points = list(set([q for p in points for q in self.lattice_type.vertex_sharing_points(p)]))
        return self.lattice_type.factory(points)

    def polyominoes(self, size: int, include_rotations_and_reflections=False) -> List[Shape]:
        transforms = self.lattice_type.transformation_functions(
            allow_rotations=not include_rotations_and_reflections,
            allow_reflections=not include_rotations_and_reflections,
        )
        polyominoes = set()
        polyomino = [Point(0, 0)]

        def apply(transform):
            transformed = [transform(Vector(p.y, p.x)) for p in polyomino]
            return tuple(p.translate(min(transformed).negate()) for p in sorted(transformed))

        def recurse():
            if len(polyomino) == size:
                polyominoes.add(frozenset([apply(transform) for transform in transforms]))
                return

            for p in polyomino:
                for q in self.lattice_type.edge_sharing_points(p):
                    if q not in polyomino:
                        polyomino.append(q)
                        recurse()
                        polyomino.pop()

        recurse()
        return list(map(Shape, sorted([min(family) for family in polyominoes])))

    def regions(self) -> Set[Tuple[Point, ...]]:
        uf = UnionFind()
        for p, q in self.edges():
            if frozenset((p, q)) not in self.junctions:
                uf.union(p, q)
        return set([tuple(q for q in self.points if uf.find(q) == p) for p in self.points if uf.find(p) == p])


class Solution(AbstractPuzzle):
    def set_loop(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        for p in sg.grid:
            for v in sg.lattice.edge_sharing_directions():
                if solved_grid[p] in sg.symbol_set.symbols_for_direction(v):
                    self.lines[frozenset((p, p.translate(v)))] = True

    def set_regions(self, puzzle: Puzzle, solved_grid: Dict[Point, int]):
        for p in puzzle.points:
            for q in puzzle.lattice_type.edge_sharing_points(p):
                if solved_grid[p] != solved_grid.get(q):
                    self.junctions[frozenset((p, q))] = True
