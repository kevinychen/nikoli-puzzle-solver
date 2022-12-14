from lib import *


class YinYang(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p, symbol in puzzle.symbols.items():
            if symbol.is_circle():
                sg.solver.add(sg.cell_is(p, symbol.is_black()))

        for i in range(2):
            continuous_region(sg, rc, lambda q: sg.cell_is(q, i))
            no2x2(sg, i)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.symbols[p] = Symbols.BLACK_CIRCLE if solved_grid[p] else Symbols.WHITE_CIRCLE
