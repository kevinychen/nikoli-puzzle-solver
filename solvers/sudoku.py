from solvers.utils import *


class Sudoku(AbstractSolver):

    def configure(self):
        sg = SymbolGrid(grilops.get_square_lattice(9), grilops.make_number_range_symbol_set(1, 9))

        for p in sg.lattice.points:
            if p in self.texts:
                sg.solver.add(sg.cell_is(p, int(self.texts[p])))

        # Numbers in each 3x3 box are distinct
        for subgrid in range(9):
            top = (subgrid // 3) * 3
            left = (subgrid % 3) * 3
            nums = [[sg.grid[Point(row, col)] for row in range(top, top + 3) for col in range(left, left + 3)]]
            sg.solver.add(Distinct(*nums))

        distinct_rows_and_columns(sg)

        return sg

    def to_standard_format(self, sg, solved_grid):
        for p in sg.lattice.points:
            if p not in self.texts:
                self.solved_texts[p] = str(solved_grid[p])
