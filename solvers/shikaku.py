from lib import *


class Shikaku(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver, rectangular=True)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

        for p, number in puzzle.texts.items():
            sg.solver.add(rc.parent_grid[p] == R)
            sg.solver.add(rc.region_size_grid[p] == number)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(sg, solved_grid)
