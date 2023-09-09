from lib import *


class KuromasuKurodoko(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, number in puzzle.texts.items():
            require_sight_line_count(sg, p, lambda q: sg.grid[q] == 0, number)

        require_continuous(sg, lambda q: sg.grid[q] == 0)
        no_adjacent_symbols(sg, 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True