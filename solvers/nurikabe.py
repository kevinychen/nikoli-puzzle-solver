import grilops
from grilops.geometry import Point
from grilops.regions import RegionConstrainer, R
from re import match
from z3 import Implies, Int, Or


def solve(puzzle):
    matched = match('pzprv3/nurikabe/(\\d+)/(\\d+)/(.*)/', puzzle)
    height = matched.group(1)
    width = matched.group(2)
    result = _solve(int(height), int(width), list(map(lambda row: row.split(' ')[:-1], matched.group(3).split('/'))))
    return 'pzprv3/nurikabe/{}/{}/{}/'.format(height, width, '/'.join(map(lambda row: ' '.join(row) + ' ', result)))


def _solve(height, width, grid):
    lattice = grilops.get_rectangle_lattice(height, width)
    symbol_set = grilops.SymbolSet([
        ("BLACK", "#"),
        ("WHITE", "+"),
    ])
    sg = grilops.SymbolGrid(lattice, symbol_set)
    rc = grilops.regions.RegionConstrainer(lattice, solver=sg.solver)

    sea_root = Int('sea')
    for row, col in lattice.points:
        p = Point(row, col)
        num = grid[row][col]
        if num.isnumeric():
            sg.solver.add(sg.cell_is(p, symbol_set.WHITE))
            sg.solver.add(rc.region_id_grid[p] == lattice.point_to_index(p))
            sg.solver.add(rc.region_size_grid[p] == int(num))
            sg.solver.add(rc.parent_grid[p] == R)
        else:
            sg.solver.add(Implies(sg.cell_is(p, symbol_set.BLACK), rc.region_id_grid[p] == sea_root))
            sg.solver.add(Implies(sg.cell_is(p, symbol_set.WHITE), rc.region_id_grid[p] != sea_root))
            sg.solver.add(Implies(sg.cell_is(p, symbol_set.WHITE), rc.parent_grid[p] != R))

    # No two regions with the same color may be adjacent
    for p in lattice.points:
        for color, region_id in \
                zip(lattice.edge_sharing_neighbors(sg.grid, p), lattice.edge_sharing_neighbors(rc.region_id_grid, p)):
            sg.solver.add(
                Implies(
                    sg.grid[p] == color.symbol,
                    rc.region_id_grid[p] == region_id.symbol))

    # No 2x2 square of black cells
    for startRow in range(height - 1):
        for startCol in range(width - 1):
            sg.solver.add(Or(*[sg.grid[Point(row, col)] == symbol_set.WHITE
                               for row in range(startRow, startRow + 2)
                               for col in range(startCol, startCol + 2)]))

    assert sg.solve()

    solved_grid = sg.solved_grid()
    return [[grid[row][col] if grid[row][col].isnumeric() else symbol_set.symbols[solved_grid[Point(row, col)]].label
              for col in range(width)] for row in range(height)]
