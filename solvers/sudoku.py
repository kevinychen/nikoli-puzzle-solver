import grilops
from grilops.geometry import Point
from re import match
from z3 import Distinct


def solve(puzzle):
    matched = match('pzprv3/sudoku/9/(.*)/', puzzle)
    result = _solve(list(map(lambda row: row.split(' ')[:-1], matched.group(1).split('/'))))
    return 'pzprv3/sudoku/9/{}/'.format('/'.join(map(lambda row: ' '.join(row) + ' ', result)))


def _solve(grid):
    lattice = grilops.get_square_lattice(9)
    symbol_set = grilops.make_number_range_symbol_set(1, 9)
    sg = grilops.SymbolGrid(lattice, symbol_set)

    for row, col in lattice.points:
        num = grid[row][col]
        if num.isnumeric():
            sg.solver.add(sg.cell_is(Point(row, col), int(num)))

    for row in range(9):
        sg.solver.add(Distinct(*[sg.grid[Point(row, col)] for col in range(9)]))
    for col in range(9):
        sg.solver.add(Distinct(*[sg.grid[Point(row, col)] for row in range(9)]))
    for subgrid in range(9):
        top = (subgrid // 3) * 3
        left = (subgrid % 3) * 3
        nums = [[sg.grid[Point(row, col)] for row in range(top, top + 3) for col in range(left, left + 3)]]
        sg.solver.add(Distinct(*nums))

    assert sg.solve()

    solved_grid = sg.solved_grid()
    return [[str(solved_grid[Point(row, col)]) for col in range(9)] for row in range(9)]
