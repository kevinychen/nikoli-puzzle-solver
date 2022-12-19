from typing import Callable, List

from grilops import Direction, Lattice
from grilops import Point, PointyToppedHexagonalLattice, RectangularLattice, Vector


class LatticeType:

    """
    An unbounded lattice, i.e. a lattice without a set of points specified.
    This is useful because there are places where we need the structure of the grid, but not the actual points.
    """

    def __init__(self, factory: Callable[[List], Lattice]):
        self.factory = factory

    def edge_sharing_directions(self) -> List[Direction]:
        return self.factory([]).edge_sharing_directions()

    def vertex_sharing_directions(self) -> List[Direction]:
        return self.factory([]).vertex_sharing_directions()

    def opposite_direction(self, d: Direction) -> Direction:
        return self.factory([]).opposite_direction(d)

    def edge_sharing_points(self, point: Point) -> List[Point]:
        return self.factory([]).edge_sharing_points(point)

    def vertex_sharing_points(self, point: Point) -> List[Point]:
        return self.factory([]).vertex_sharing_points(point)

    def transformation_functions(
        self, allow_rotations: bool, allow_reflections: bool
    ) -> List[Callable[[Vector], Vector]]:
        return self.factory([]).transformation_functions(allow_rotations, allow_reflections)


class LatticeTypes:

    SQUARE = LatticeType(RectangularLattice)
    HEXAGON = LatticeType(PointyToppedHexagonalLattice)
