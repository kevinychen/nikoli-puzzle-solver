from solvers.utils import *


class Kropki(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_square_lattice(puzzle.width),
            grilops.make_number_range_symbol_set(1, puzzle.width))

        for p in sg.grid:
            for v, borders in [(Directions.W, puzzle.vertical_borders), (Directions.N, puzzle.horizontal_borders)]:
                q = p.translate(v)
                if q in sg.grid:
                    white_condition = Or(sg.grid[p] == sg.grid[q] + 1, sg.grid[p] + 1 == sg.grid[q])
                    black_condition = Or(sg.grid[p] == sg.grid[q] * 2, sg.grid[p] * 2 == sg.grid[q])
                    if p in borders:
                        sg.solver.add(black_condition if borders[p].is_black() else white_condition)
                    else:
                        sg.solver.add(Not(Or(white_condition, black_condition)))

        distinct_rows_and_columns(sg)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            solution.texts[p] = solved_grid[p]
