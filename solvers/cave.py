from lib import *


class Cave(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, 1))

        for p in sg.grid.keys() - puzzle.points:
            sg.solver.add(sg.grid[p] == 1)

        for p, number in puzzle.texts.items():
            require_sight_line_count(sg, p, lambda q: sg.grid[q] == 0, number)

        for i in range(2):
            require_continuous(sg, lambda q: sg.grid[q] == i)

        solved_grid, solution = solve(sg)
        for p in puzzle.points:
            if solved_grid[p]:
                solution.shaded[p] = True
