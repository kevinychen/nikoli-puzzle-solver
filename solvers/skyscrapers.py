from lib import *


class Skyscrapers(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                line = sight_line(sg, p.translate(v), v)
                sg.solver.add(Sum([And([sg.grid[q] > sg.grid[r] for r in line[:i]]) for i, q in enumerate(line)])
                              == puzzle.texts[p])

        for p, number in puzzle.texts.items():
            if p in puzzle.points:
                sg.solver.add(sg.grid[p] == number)

        distinct_rows_and_columns(sg)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
