from lib import *


class Slitherlink(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if p not in puzzle.points:
                sg.solver.add(sg.cell_is(p, 0))

        for p, number in puzzle.texts.items():
            sg.solver.add(Sum([sg.grid[p] != n.symbol for n in sg.edge_sharing_neighbors(p)]) == number)

        for i in range(2):
            continuous_region(sg, rc, lambda q: sg.cell_is(q, i))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(puzzle, solved_grid)
