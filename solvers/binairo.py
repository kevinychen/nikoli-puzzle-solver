from itertools import combinations

from lib import *


class Binairo(AbstractSolver):
    def run(self, puzzle, solve):
        symbols = list(set(symbol for symbol in puzzle.symbols.values()))
        assert len(symbols) == 2

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Satisfy given symbols
        for p, symbol in puzzle.symbols.items():
            sg.solver.add(sg.grid[p] == symbols.index(symbol))

        # Each row and column contains the same number of whites and blacks
        for p, v in puzzle.entrance_points():
            sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == puzzle.width // 2)

        # No three-in-a-row
        for p in sg.grid:
            for v in sg.lattice.edge_sharing_directions():
                points = [Point(p.y + v.vector.dy * i, p.x + v.vector.dx * i) for i in range(1, 3)]
                sg.solver.add(Or([sg.grid[p] != sg.grid.get(q) for q in points]))

        # All rows and columns are unique
        for i1, i2 in combinations(range(puzzle.width), 2):
            sg.solver.add(Or([sg.grid[Point(i1, j)] != sg.grid[Point(i2, j)] for j in range(puzzle.width)]))
            sg.solver.add(Or([sg.grid[Point(j, i1)] != sg.grid[Point(j, i2)] for j in range(puzzle.width)]))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.symbols[p] = symbols[solved_grid[p]]
