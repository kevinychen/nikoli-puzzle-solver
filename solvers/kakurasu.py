from lib import *


class KakurasuIndexSums(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, v in puzzle.entrance_points():
            if p in puzzle.texts and v in (Directions.E, Directions.S):
                sg.solver.add(
                    Sum([If(sg.grid[q] == 1, i + 1, 0) for i, q in enumerate(sight_line(sg, p.translate(v), v))])
                    == puzzle.texts[p]
                )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
