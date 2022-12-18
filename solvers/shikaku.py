from lib import *


class Shikaku(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver, rectangular=True)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

        for p, number in puzzle.texts.items():
            sg.solver.add(rc.parent_grid[p] == R)
            sg.solver.add(rc.region_size_grid[p] == number)

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
