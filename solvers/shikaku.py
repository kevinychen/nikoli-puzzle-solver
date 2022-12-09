from solvers.utils import *


class Shikaku(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, puzzle.height * puzzle.width))
        rc = RegionConstrainer(sg.lattice, sg.solver, rectangular=True)

        for p in sg.grid:
            if p in puzzle.texts:
                sg.solver.add(rc.parent_grid[p] == R)
                sg.solver.add(rc.region_size_grid[p] == puzzle.texts[p])
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(sg, solved_grid)
