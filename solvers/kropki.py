from lib import *


class Kropki(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for p, q in puzzle.edges():
            white_condition = Or(sg.grid[p] == sg.grid[q] + 1, sg.grid[p] + 1 == sg.grid[q])
            black_condition = Or(sg.grid[p] == sg.grid[q] * 2, sg.grid[p] * 2 == sg.grid[q])
            symbol = puzzle.junctions.get(frozenset((p, q)))
            if symbol is None:
                sg.solver.add(Not(Or(white_condition, black_condition)))
            elif symbol.is_black():
                sg.solver.add(black_condition)
            else:
                sg.solver.add(white_condition)

        distinct_rows_and_columns(sg)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            solution.texts[p] = solved_grid[p]
