from lib import *


class YajisanKazusan(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if p in puzzle.texts and p in puzzle.symbols:
                (v,) = puzzle.symbols[p].get_arrows()
                sg.solver.add(
                    Or(sg.grid[p] == 1, Sum([sg.grid[q] == 1 for q in sight_line(sg, p, v)]) == puzzle.texts[p])
                )

        no_adjacent_symbols(sg, 1)
        continuous_region(sg, rc, lambda q: sg.grid[q] == 0)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
