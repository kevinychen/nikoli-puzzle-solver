from solvers.utils import *


class SudokuSolver(AbstractSolver):

    def __init__(self, puzzle):
        self.grid = [[None] * 9 for i in range(9)]
        for k, v in puzzle['q']['number'].items():
            k = int(k)
            self.grid[k // 13 - 2][k % 13 - 2] = int(v[0])

    def to_penpa(self, solved_grid):
        return {
            'number': dict([(str((row + 2) * 13 + col + 2), [str(solved_grid[Point(row, col)]), 2, '1'])
                             for row in range(9) for col in range(9) if self.grid[row][col] is None]),
            'surface': {},
            'squareframe': {},
        }

    def lattice(self):
        return grilops.get_square_lattice(9)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(1, 9)

    def configure(self, sg):
        for p in sg.lattice.points:
            num = self.grid[p.y][p.x]
            if num is not None:
                sg.solver.add(sg.cell_is(p, num))

        # Numbers in each 3x3 box are distinct
        for subgrid in range(9):
            top = (subgrid // 3) * 3
            left = (subgrid % 3) * 3
            nums = [[sg.grid[Point(row, col)] for row in range(top, top + 3) for col in range(left, left + 3)]]
            sg.solver.add(Distinct(*nums))

        distinct_rows_and_columns(sg)
