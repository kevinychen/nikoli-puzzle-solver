from itertools import combinations

from lib import *


class Binairo(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, symbol in puzzle.symbols.items():
            if symbol.is_circle():
                sg.solver.add(sg.cell_is(p, symbol.is_black()))

        # Each row and column contains the same number of whites and blacks
        for p, v in puzzle.entrance_points():
            sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == puzzle.width // 2)

        # No three-in-a-row of the same color
        for p in sg.grid:
            for v in sg.lattice.edge_sharing_directions():
                q = p.translate(v)
                r = q.translate(v)
                if r in sg.grid:
                    sg.solver.add(Or(sg.grid[p] != sg.grid[q], sg.grid[p] != sg.grid[r]))

        # All rows and columns are unique
        for i1, i2 in combinations(range(puzzle.width), 2):
            sg.solver.add(Or([sg.grid[Point(i1, j)] != sg.grid[Point(i2, j)] for j in range(puzzle.width)]))
            sg.solver.add(Or([sg.grid[Point(j, i1)] != sg.grid[Point(j, i2)] for j in range(puzzle.width)]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.symbols[p] = Symbols.BLACK_CIRCLE if solved_grid[p] else Symbols.WHITE_CIRCLE
