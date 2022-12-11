from itertools import combinations

from lib import *


class Binairo(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_square_lattice(puzzle.width),
            grilops.make_number_range_symbol_set(0, 1))

        for p, symbol in puzzle.symbols.items():
            if symbol.is_circle():
                sg.solver.add(sg.cell_is(p, symbol.is_black()))

        # Each row and column contains the same number of whites and blacks
        for p, v in puzzle.border_lines(Directions.E, Directions.S):
            sg.solver.add(Sum([sg.cell_is(q, 1) for q in sight_line(sg, p.translate(v), v)]) == puzzle.width // 2)

        # No three-in-a-row of the same color
        for p in sg.grid:
            for v in Directions.E, Directions.S:
                q = p.translate(v)
                r = q.translate(v)
                if r in sg.grid:
                    sg.solver.add(Or(sg.grid[p] != sg.grid[q], sg.grid[p] != sg.grid[r]))

        # All rows and columns are unique
        for row1, row2 in combinations(range(puzzle.width), 2):
            sg.solver.add(Or([sg.grid[Point(row1, col)] != sg.grid[Point(row2, col)] for col in range(puzzle.width)]))
        for col1, col2 in combinations(range(puzzle.width), 2):
            sg.solver.add(Or([sg.grid[Point(row, col1)] != sg.grid[Point(row, col2)] for row in range(puzzle.width)]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.symbols[p] = Symbols.BLACK_CIRCLE if solved_grid[p] else Symbols.WHITE_CIRCLE
