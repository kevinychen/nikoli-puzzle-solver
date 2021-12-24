import grilops
from grilops.geometry import Point
from re import match
from solvers.abstract_solver import AbstractSolver
from z3 import Distinct


class SudokuSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/sudoku/9/(.*)/', pzprv3)
        self.grid = list(map(lambda row: row.split(' ')[:-1], matched.group(1).split('/')[:9]))

    def to_pzprv3(self, solved_grid):
        result = [['.' if self.grid[row][col].isnumeric() else str(solved_grid[Point(row, col)])
                   for col in range(9)] for row in range(9)]
        return 'pzprv3/sudoku/9/{}/{}/'.format(
            '/'.join(map(lambda row: ' '.join(row) + ' ', self.grid)),
            '/'.join(map(lambda row: ' '.join(row) + ' ', result)))

    def lattice(self):
        return grilops.get_square_lattice(9)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(1, 9)

    def configure(self, sg):
        for row, col in sg.lattice.points:
            num = self.grid[row][col]
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
