from lib import *


class LightAndShadow(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p, q in puzzle.edges():
            sg.solver.add((sg.grid[p] == sg.grid[q]) == (rc.region_id_grid[p] == rc.region_id_grid[q]))

        # Each number is the root of a region
        for p in sg.grid:
            sg.solver.add((rc.parent_grid[p] == R) == (p in puzzle.texts))

            if p in puzzle.texts:
                sg.solver.add((sg.grid[p] == 1) == (p in puzzle.shaded))

        # The number represents the size of the region
        for p, number in puzzle.texts.items():
            sg.solver.add(rc.region_size_grid[p] == number)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
