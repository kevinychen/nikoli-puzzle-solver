from lib import *


class Aquarium(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Satisfy water counts
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        # Each region must have all water at the same level
        for region in puzzle.regions():
            sg.solver.add(Or(
                [And([sg.cell_is(p, p.y >= height) for p in region]) for height in range(puzzle.height + 1)]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
