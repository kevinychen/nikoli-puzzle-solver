from lib import *


class Kurotto(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p in puzzle.symbols:
            sg.solver.add(sg.grid[p] == 0)

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == 0)
            require_region_area(sg, p, lambda q: sg.grid[q] == 1, number + 1)

        solved_grid, solution = solve(sg)
        for p in puzzle.points:
            if solved_grid[p]:
                solution.shaded[p] = True
