from lib import *


class Sudoku(AbstractSolver):
    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        for p, v in puzzle.entrance_points():
            sg.solver.add(Distinct([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]))
        for region in puzzle.regions():
            sg.solver.add(Distinct([sg.grid[p] for p in region]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
