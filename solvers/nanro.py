from lib import *


class Nanro(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])

        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points) + 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        # At least one unshaded square in each region
        for region in puzzle.regions():
            sg.solver.add(Or([sg.grid[q] > 0 for q in region]))

        # All unshaded squares have a number equal to the total number of unshaded squares in that region
        for p in sg.grid:
            sg.solver.add(Implies(
                sg.grid[p] > 0, sg.grid[p] == Sum([sg.grid[q] > 0 for q in sg.grid if regions[p] == regions[q]])))

        # No two regions with the same number of white squares may be adjacent
        for p, q in puzzle.edges():
            if regions[p] != regions[q]:
                sg.solver.add(Or(sg.grid[p] == 0, sg.grid[q] == 0, sg.grid[p] != sg.grid[q]))

        continuous_region(sg, rc, lambda r: sg.grid[r] > 0)
        no2x2(sg, lambda r: sg.grid[r] > 0)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 0:
                solution.shaded[p] = True
            elif p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
