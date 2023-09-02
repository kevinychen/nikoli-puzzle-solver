from lib import *


class Norinori(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False, min_region_size=2, max_region_size=2)

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 0) == (rc.region_id_grid[p] == -1))

        for region in puzzle.regions():
            sg.solver.add(Sum([sg.grid[p] for p in region]) == 2)

        no_adjacent_regions(sg, rc)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
