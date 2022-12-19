from abc import ABC
from typing import Callable, Dict, FrozenSet, List, Set, Tuple, Union

from grilops import Direction, Lattice, Point, SymbolGrid, Vector
from grilops.shapes import Shape

from lib._lattice_type import LatticeType
from lib._symbols import Symbol
from lib._union_find import UnionFind


class AbstractPuzzle(ABC):
    def __init__(self):
        self.shaded: Dict[Point, Union[bool, int]] = {}
        self.texts: Dict[Point, Union[int, str]] = {}
        self.symbols: Dict[Point, Symbol] = {}

        # Text on an edge, for example ((y,x), NE) is the text in the top right corner of (y, x).
        self.edge_texts: Dict[Tuple[Point, Direction], Union[int, str]] = {}

        # Contains a set of two points (p,q) if there is a line between p and q. For convenience, in the given puzzle,
        # both (p,q) and (q,p) will be present, but only one of them needs to be set in the solution.
        self.borders: Dict[Tuple[Point, Point], bool] = {}

        # Any value (text or symbol) between cells in the grid. For example, a key of 2 cells corresponds to a value
        # between them. A key of more than 2 cells is a vertex, e.g. each corner of a square grid is a junction of 4
        # cells.
        self.junction_texts: Dict[FrozenSet[Point], Union[int, str]] = {}
        self.junction_symbols: Dict[FrozenSet[Point], Symbol] = {}

        # Contains a set of two points (p,q) if there is a line from p to q. For convenience, in the given puzzle,
        # both (p,q) and (q,p) will be present, but only one of them needs to be set in the solution.
        self.lines: Dict[Tuple[Point, Point], Union[bool, int]] = {}

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
            if (p, q) not in self.borders:
                uf.union(p, q)
        return set([tuple(q for q in self.points if uf.find(q) == p) for p in self.points if uf.find(p) == p])


class Solution(AbstractPuzzle):
    def set_loop(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        for p in sg.grid:
            for v in sg.lattice.edge_sharing_directions():
                if solved_grid[p] in sg.symbol_set.symbols_for_direction(v):
                    self.lines[p, p.translate(v)] = True

    def set_regions(self, puzzle: Puzzle, solved_grid: Dict[Point, int]):
        for p in puzzle.points:
            for q in puzzle.lattice_type.edge_sharing_points(p):
                if solved_grid[p] != solved_grid.get(q):
                    self.borders[p, q] = True
