from solvers.utils import *


class Minesweeper(AbstractSolver):

    def configure(self):
        sg = self.get_symbol_grid(
            grilops.get_rectangle_lattice(self.height, self.width),
            grilops.make_number_range_symbol_set(0, 1))

        for p in self.texts:
            sg.solver.add(sg.cell_is(p, 0))
            sg.solver.add(Sum([is_mine.symbol for is_mine in sg.vertex_sharing_neighbors(p)]) == int(self.texts[p]))

    def to_standard_format(self, sg, solved_grid):
        for p in sg.lattice.points:
            if p not in self.texts:
                self.solved_symbols[p] = Symbol(4, 'sun_moon') if solved_grid[p] else Symbol(0, 'star')
