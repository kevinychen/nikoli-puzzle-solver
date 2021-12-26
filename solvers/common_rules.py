from collections import defaultdict
from grilops import Symbol, SymbolGrid, SymbolSet
from grilops.geometry import Point, Vector
from grilops.regions import RegionConstrainer
from typing import Callable, List
from uuid import uuid4
from z3 import And, Distinct, Implies, Int, Not


def binary_symbol_set(zero: str, one: str):
    return SymbolSet([(zero, "+"), (one, "#")])


def continuous_region(sg: SymbolGrid, rc: RegionConstrainer, symbol: Symbol):
    region_root = Int(str(uuid4()))
    for p in sg.lattice.points:
        sg.solver.add(Implies(sg.grid[p] == symbol, rc.region_id_grid[p] == region_root))
        sg.solver.add(Implies(sg.grid[p] != symbol, rc.region_id_grid[p] != region_root))


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


def no2x2(sg: SymbolGrid, symbol: Symbol):
    for p in sg.grid:
        box = [p, Point(p.y + 1, p.x), Point(p.y, p.x + 1), Point(p.y + 1, p.x + 1)]
        if all([p in sg.grid for p in box]):
            sg.solver.add(Not(And([sg.grid[p] == symbol for p in box])))


def parse_table(grid_str):
    return list(map(lambda row: row.split(' ')[:-1], grid_str.split('/')))


def sight_line(p: Point, direction: Vector, good: Callable[[Point], bool]) -> List[Point]:
    line = []
    while good(p):
        line.append(p)
        p = p.translate(direction)
    return line


def table(grid):
    return '/'.join(map(lambda row: ' '.join(row) + ' ', grid))
