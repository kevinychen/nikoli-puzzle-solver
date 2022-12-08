from solvers.utils import *

WHITE = '1'
BLACK = '2'


class Kropki(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(1, puzzle.width))

        for p in sg.lattice.points:
            for v, borders in [(Vector(0, 1), puzzle.vertical_borders), (Vector(1, 0), puzzle.horizontal_borders)]:
                q = p.translate(v)
                if q in sg.grid:
                    white_condition = Or(sg.grid[p] == sg.grid[q] + 1, sg.grid[p] + 1 == sg.grid[q])
                    black_condition = Or(sg.grid[p] == sg.grid[q] * 2, sg.grid[p] * 2 == sg.grid[q])
                    if q in borders:
                        sg.solver.add(black_condition if borders[q].is_black() else white_condition)
                    else:
                        sg.solver.add(Not(Or(white_condition, black_condition)))

        distinct_rows_and_columns(sg)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.lattice.points:
            solution.texts[p] = solved_grid[p]
