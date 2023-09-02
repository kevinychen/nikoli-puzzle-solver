from lib import *


class Creek(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for junction, number in puzzle.junction_texts.items():
            sg.solver.add(Sum([sg.grid[q] for q in junction if q in sg.grid]) == number)

        require_continuous(sg, lambda q: sg.grid[q] == 0)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
