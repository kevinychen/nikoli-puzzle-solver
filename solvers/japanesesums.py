from lib import *


class JapaneseSums(AbstractSolver):
    def run(self, puzzle, solve):
        maximum = int(puzzle.parameters["maximum"])

        sg = SymbolGrid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, maximum))

        for p in sg.grid.keys() - puzzle.points:
            sg.solver.add(sg.grid[p] == 0)

        # Each number appears in each row and in each column at most once
        for i in range(1, maximum + 1):
            for p, v in puzzle.entrance_points():
                sg.solver.add(Sum([sg.grid[q] == i for q in sight_line(sg, p.translate(v), v)]) <= 1)

        # Block sums satisfy counts
        for p, v in puzzle.entrance_points():
            require_contiguous_block_sums(
                sg,
                sight_line(sg, p, v),
                [puzzle.texts[q] for q in sight_line(sg, p, v.vector.negate(), lambda q: q in puzzle.texts)][::-1],
            )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] > 0:
                solution.texts[p] = solved_grid[p]
            elif p in puzzle.points:
                solution.shaded[p] = True
