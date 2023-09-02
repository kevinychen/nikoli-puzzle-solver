from lib import *


class CanalView(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Each number represents the number of shaded squares that can be "seen" from the number
        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == 0)
            require_sight_line_count(sg, p, lambda q: p == q or sg.grid[q] == 1, number + 1)

        require_continuous(sg, lambda q: sg.grid[q] == 1)
        no2x2(sg, lambda q: sg.grid[q] == 1)

        solved_grid, solution = solve(sg)
        for p in puzzle.points:
            if solved_grid[p]:
                solution.shaded[p] = True
