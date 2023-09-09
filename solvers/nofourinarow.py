from lib import *


class NoFourInARow(AbstractSolver):
    def run(self, puzzle, solve):
        symbols = list(set(symbol for symbol in puzzle.symbols.values()))
        assert len(symbols) == 2

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, symbol in puzzle.symbols.items():
            sg.solver.add(sg.grid[p] == symbols.index(symbol))

        # No four-in-a-row
        for p in sg.grid:
            for v in sg.lattice.vertex_sharing_directions():
                points = [Point(p.y + v.vector.dy * i, p.x + v.vector.dx * i) for i in range(1, 4)]
                sg.solver.add(Or([sg.grid[p] != sg.grid.get(q) for q in points]))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.symbols:
                symbol = symbols[solved_grid[p]]
                solution.symbols[p] = Symbol(symbol.style, symbol.shape.replace("_B", "_E"))