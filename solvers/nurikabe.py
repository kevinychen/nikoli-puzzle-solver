from lib import *


class Nurikabe(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False)

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 1) == (rc.region_id_grid[p] == -1))

        # Each number is the root of a region
        for p in sg.grid:
            sg.solver.add((rc.parent_grid[p] == R) == (p in puzzle.texts))

        # The number represents the size of the region
        for p, number in puzzle.texts.items():
            sg.solver.add(rc.region_size_grid[p] == number)

        no_adjacent_regions(sg, rc)
        require_continuous(sg, lambda q: sg.grid[q] == 1)
        no2x2(sg, lambda q: sg.grid[q] == 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
