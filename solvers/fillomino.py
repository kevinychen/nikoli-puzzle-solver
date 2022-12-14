from lib import *


class Fillomino(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_size_grid[p])

        # Adjacent regions cannot have the same size
        for p, q in puzzle.edges():
            sg.solver.add(Implies(
                rc.region_id_grid[p] != rc.region_id_grid[q], rc.region_size_grid[p] != rc.region_size_grid[q]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(sg, solved_grid)
