from lib import *


class Nonogram(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, 1))

        for p in sg.grid.keys() - puzzle.points:
            sg.solver.add(sg.grid[p] == 0)

        # Block sizes satisfy counts
        for p, v in puzzle.entrance_points():
            require_contiguous_block_sums(
                sg,
                sight_line(sg, p, v),
                [puzzle.texts[q] for q in sight_line(sg, p, v.vector.negate(), lambda q: q in puzzle.texts)][::-1],
            )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
