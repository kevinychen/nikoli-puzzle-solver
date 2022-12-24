from lib import *


class YinYang(AbstractSolver):
    def run(self, puzzle, solve):
        symbols = list(set(symbol for symbol in puzzle.symbols.values()))
        assert len(symbols) == 2

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p, symbol in puzzle.symbols.items():
            sg.solver.add(sg.grid[p] == symbols.index(symbol))

        for i in range(2):
            continuous_region(sg, rc, lambda q: sg.grid[q] == i)
            no2x2(sg, lambda q: sg.grid[q] == i)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.symbols[p] = symbols[solved_grid[p]]
