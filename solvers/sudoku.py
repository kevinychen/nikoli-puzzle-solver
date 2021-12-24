import grilops
from grilops.geometry import Point
from re import match
from z3 import Distinct


def solve(puzzle):
    matched = match('pzprv3/sudoku/9/(.*)/', puzzle)
    rows = matched.group(1).split('/')
    result = _solve([[0 if rows[y][2 * x] == '.' else int(rows[y][2 * x]) for x in range(9)] for y in range(9)])
    formatted = 'pzprv3/sudoku/9/'
    for y in range(9):
        for x in range(9):
            formatted += str(result[y][x]) + ' '
        formatted += '/'
    return formatted


def _solve(givens):
    sym = grilops.make_number_range_symbol_set(1, 9)
    lattice = grilops.get_square_lattice(9)
    sg = grilops.SymbolGrid(lattice, sym)

    for y, x in lattice.points:
        given = givens[y][x]
        if given != 0:
            sg.solver.add(sg.cell_is(Point(y, x), given))

    rows = [[sg.grid[Point(y, x)] for x in range(9)] for y in range(9)]
    for row in rows:
        sg.solver.add(Distinct(*row))

    columns = [[sg.grid[Point(y, x)] for y in range(9)] for x in range(9)]
    for column in columns:
        sg.solver.add(Distinct(*column))

    for subgrid_index in range(9):
        top = (subgrid_index // 3) * 3
        left = (subgrid_index % 3) * 3
        cells = [sg.grid[Point(y, x)] for y in range(top, top + 3) for x in range(left, left + 3)]
        sg.solver.add(Distinct(*cells))

    assert sg.solve()

    solved_grid = sg.solved_grid()
    return [[solved_grid[Point(y, x)] for x in range(9)] for y in range(9)]


def _test():
    givens = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ]
    for row in _solve(givens):
        print(row)


if __name__ == '__main__':
    _test()
