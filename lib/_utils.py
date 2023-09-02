from collections import defaultdict
from typing import Callable, List, Set, Tuple, Union
from uuid import uuid4

from grilops import SymbolGrid
from grilops.geometry import Direction, Point, Vector
from z3 import Int


def junctions(sg: SymbolGrid) -> List[Set[Point]]:
    """Returns all vertices in the puzzle, where each vertex is represented by all cells with that vertex."""
    neighbors = defaultdict(set)
    for p in sg.grid:
        for q in sg.lattice.vertex_sharing_points(p):
            if q in sg.grid:
                neighbors[p].add(q)
    for p in sg.grid:
        for q in neighbors[p]:
            for r in neighbors[p].intersection(neighbors[q]):
                yield sorted(neighbors[p].intersection(neighbors[q], neighbors[r]).union((p, q, r)))


def sight_line(
    sg: SymbolGrid, p: Point, direction: Union[Direction, Vector], good: Callable[[Point], bool] = None
) -> List[Point]:
    line = []
    while (p in sg.grid) if good is None else good(p):
        line.append(p)
        p = p.translate(direction)
    return line


def straight_edge_sharing_direction_pairs(sg: SymbolGrid) -> List[Tuple[Direction, ...]]:
    return sorted(
        set([tuple(sorted((v, sg.lattice.opposite_direction(v)))) for v in sg.lattice.edge_sharing_directions()])
    )


def var():
    return Int(str(uuid4()))
