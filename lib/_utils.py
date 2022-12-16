from collections import defaultdict
from typing import Callable, List, Union
from uuid import uuid4

from grilops import SymbolGrid
from grilops.geometry import Direction, Point, Vector
from grilops.regions import RegionConstrainer
from z3 import And, BoolRef, Distinct, Int, Not


def continuous_region(sg: SymbolGrid, rc: RegionConstrainer, good: Callable[[Point], BoolRef]):
    region_root = var()
    for p in sg.grid:
        sg.solver.add(good(p) == (rc.region_id_grid[p] == region_root))


def distinct_rows_and_columns(sg: SymbolGrid):
    rows = defaultdict(list)
    cols = defaultdict(list)
    for p in sg.grid:
        rows[p.x].append(sg.grid[p])
        cols[p.y].append(sg.grid[p])
    for row in rows.values():
        sg.solver.add(Distinct(*row))
    for col in cols.values():
        sg.solver.add(Distinct(*col))


def no_adjacent_symbols(sg: SymbolGrid, symbol: int, no_diagonal: bool = False):
    for p in sg.grid:
        for n in sg.vertex_sharing_neighbors(p) if no_diagonal else sg.edge_sharing_neighbors(p):
            sg.solver.add(Not(And(sg.cell_is(p, symbol), n.symbol == symbol)))


def no2x2(sg: SymbolGrid, of: Callable[[Point], BoolRef]):
    # The generalization to non-square grids is: not all regions that touch a vertex can be marked.
    neighbors = defaultdict(set)
    for p in sg.grid:
        for q in sg.lattice.vertex_sharing_points(p):
            if q in sg.grid:
                neighbors[p].add(q)
    for p in sg.grid:
        for q in neighbors[p]:
            for r in neighbors[p].intersection(neighbors[q]):
                sg.solver.add(Not(And(
                    [of(p) for p in neighbors[p].intersection(neighbors[q], neighbors[r]).union((p, q, r))])))


def sight_line(
        sg: SymbolGrid,
        p: Point,
        direction: Union[Direction, Vector],
        good: Callable[[Point], bool] = None) -> List[Point]:
    line = []
    while (p in sg.grid) if good is None else good(p):
        line.append(p)
        p = p.translate(direction)
    return line


def var():
    return Int(str(uuid4()))
