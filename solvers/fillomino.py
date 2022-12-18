from lib import *


class Fillomino(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_size_grid[p])

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        # Adjacent regions cannot have the same size
        for p, q in puzzle.edges():
            sg.solver.add(
                Implies(rc.region_id_grid[p] != rc.region_id_grid[q], rc.region_size_grid[p] != rc.region_size_grid[q])
            )

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
