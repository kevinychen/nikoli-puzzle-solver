from lib import *


class KuromasuKurodoko(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, number in puzzle.texts.items():
            require_sight_line_count(sg, p, lambda q: sg.grid[q] == 1, number)

        require_continuous(sg, lambda q: sg.grid[q] == 1)
        no_adjacent_symbols(sg, 0)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] == 0:
                solution.shaded[p] = True
