from solvers.utils import *


class SudokuSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/sudoku/9/(.*)/', pzprv3)
        self.grid = parse_table(matched.group(1))[:9]

    def to_pzprv3(self, solved_grid):
        result = [['.' if self.grid[row][col].isnumeric() else str(solved_grid[Point(row, col)])
                   for col in range(9)] for row in range(9)]
        return f'pzprv3/sudoku/9/{table(self.grid)}/{table(result)}/'

    def lattice(self):
        return grilops.get_square_lattice(9)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(1, 9)

    def configure(self, sg):
        for p in sg.lattice.points:
            num = self.grid[p.y][p.x]
            if num.isnumeric():
                sg.solver.add(sg.cell_is(p, int(num)))

        # Numbers in each 3x3 box are distinct
        for subgrid in range(9):
            top = (subgrid // 3) * 3
            left = (subgrid % 3) * 3
            nums = [[sg.grid[Point(row, col)] for row in range(top, top + 3) for col in range(left, left + 3)]]
            sg.solver.add(Distinct(*nums))

        distinct_rows_and_columns(sg)
