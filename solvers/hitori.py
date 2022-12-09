from solvers.utils import *


class Hitori(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_square_lattice(puzzle.width),
            grilops.make_number_range_symbol_set(0, puzzle.width))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p, text in puzzle.texts.items():
            sg.solver.add(sg.cell_is_one_of(p, (0, text)))

        # Each number appears in each row and in each column at most once
        for i in range(1, puzzle.width + 1):
            for p, v in puzzle.border_lines(Directions.E, Directions.S):
                sg.solver.add(Sum([sg.cell_is(q, i) for q in sight_line(sg, p.translate(v), v)]) <= 1)

        continuous_region(sg, rc, lambda q: sg.grid[q] != 0)
        no_adjacent_symbols(sg, 0)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 0:
                solution.shaded[p] = True
