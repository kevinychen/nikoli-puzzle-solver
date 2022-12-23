from typing import Callable, List

from grilops import (
    Direction,
    FlatToppedHexagonalLattice,
    Lattice,
    Point,
    PointyToppedHexagonalLattice,
    RectangularLattice,
    Vector,
)


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


class UpAndDownPointingTriangularLattice(FlatToppedHexagonalLattice):

    """
    This is implemented by inscribing a regular hexagon in each triangle, and treating it as a hexagonal lattice.

    The upward-pointing triangles have y-coordinate 0 (mod 3), and the downward-pointing triangles have y-coordinate
    2 (mod 3). Points with y-coordinate 1 (mod 3) are invalid.

    We also need to update the vertex sharing directions, because for two triangles that share a vertex, their inscribed
    hexagons might not. However, we can still simulate this by expanding the set of directions.
    """

    def edge_sharing_points(self, point: Point) -> List[Point]:
        return [p for p in super().edge_sharing_points(point) if p.y % 3 != 1]

    def vertex_sharing_directions(self) -> List[Direction]:
        directions = super().edge_sharing_directions()
        for dy in range(-4, 5):
            for dx in range(-2, 3):
                v = Vector(dy, dx)
                if (dy + dx) % 2 == 0 and abs(dy) + abs(dx) <= 4 and all(w.vector != v for w in directions):
                    directions.append(Direction("", v))
        return directions

    def vertex_sharing_points(self, point: Point) -> List[Point]:
        return [p for p in super().vertex_sharing_points(point) if p.y % 3 != 1]


class LatticeTypes:

    SQUARE = LatticeType(RectangularLattice)
    HEXAGON = LatticeType(PointyToppedHexagonalLattice)
    TRIANGLE = LatticeType(UpAndDownPointingTriangularLattice)
