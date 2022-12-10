from collections import defaultdict
from typing import Callable, List, Union
from uuid import uuid4

from grilops import SymbolGrid
from grilops.geometry import Direction, Point, Vector
from grilops.regions import RegionConstrainer
from z3 import And, BoolRef, Distinct, Int, Not


def continuous_region(sg: SymbolGrid, rc: RegionConstrainer, good: Callable[[Point], BoolRef]):
    region_root = Int(str(uuid4()))
    for p in sg.lattice.points:
        sg.solver.add(good(p) == (rc.region_id_grid[p] == region_root))


def distinct_rows_and_columns(sg: SymbolGrid):
    rows = defaultdict(list)
    cols = defaultdict(list)
    for p in sg.lattice.points:
        rows[p.x].append(sg.grid[p])
        cols[p.y].append(sg.grid[p])
    for row in rows.values():
        sg.solver.add(Distinct(*row))
    for col in cols.values():
        sg.solver.add(Distinct(*col))


def no_adjacent_symbols(sg: SymbolGrid, symbol: int, no_diagonal: bool = False):
    for p in sg.lattice.points:
        for n in sg.vertex_sharing_neighbors(p) if no_diagonal else sg.edge_sharing_neighbors(p):
            sg.solver.add(Not(And(sg.cell_is(p, symbol), n.symbol == symbol)))


def no2x2(sg: SymbolGrid, symbol: int):
    for p in sg.grid:
        box = [p, Point(p.y + 1, p.x), Point(p.y, p.x + 1), Point(p.y + 1, p.x + 1)]
        if all([p in sg.grid for p in box]):
            sg.solver.add(Not(And([sg.cell_is(p, symbol) for p in box])))


def sight_line(
        sg: SymbolGrid,
        p: Point,
        direction: Union[Direction, Vector],
        good: Callable[[Point], bool] = lambda _: True) -> List[Point]:
    line = []
    while p in sg.grid and good(p):
        line.append(p)
        p = p.translate(direction)
    return line
