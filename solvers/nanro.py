from lib import *


class Nanro(AbstractSolver):
    def run(self, puzzle, solve):
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points) + 1))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        # At least one unshaded square in each region
        for region in puzzle.regions():
            sg.solver.add(Or([sg.grid[q] > 0 for q in region]))

        # All unshaded squares have a number equal to the total number of unshaded squares in that region
        for p in sg.grid:
            sg.solver.add(
                Implies(
                    sg.grid[p] > 0, sg.grid[p] == Sum([sg.grid[q] > 0 for q in sg.grid if regions[p] == regions[q]])
                )
            )

        # No two regions with the same number of white squares may be adjacent
        for p, q in puzzle.edges():
            if regions[p] != regions[q]:
                sg.solver.add(Or(sg.grid[p] == 0, sg.grid[q] == 0, sg.grid[p] != sg.grid[q]))

        require_continuous(sg, lambda p: sg.grid[p] > 0)
        no2x2(sg, lambda p: sg.grid[p] > 0)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] == 0:
                solution.shaded[p] = True
            elif p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
