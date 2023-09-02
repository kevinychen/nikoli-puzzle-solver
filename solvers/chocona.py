from lib import *


class Chocona(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False)

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 0) == (rc.region_id_grid[p] == -1))

        # Regions must be rectangular
        for junction in junctions(sg):
            sg.solver.add(Sum([sg.grid[q] == 0 for q in junction]) != 1)

        # Require number of black squares in each region
        for p, number in puzzle.texts.items():
            region = next(region for region in puzzle.regions() if p in region)
            sg.solver.add(Sum([sg.grid[q] for q in region]) == number)

        no_adjacent_regions(sg, rc)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
