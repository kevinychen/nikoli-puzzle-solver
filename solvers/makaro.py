from lib import *


class Makaro(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 0) == (p in puzzle.shaded))

        # Each region must have numbers from 1 to n
        for region in puzzle.regions():
            region = [p for p in region if p not in puzzle.shaded]
            if region:
                for i in range(1, len(region) + 1):
                    sg.solver.add(Sum([sg.grid[p] == i for p in region]) == 1)

        # Two of the same number may not be adjacent
        for p, q in puzzle.edges():
            sg.solver.add(Or(sg.grid[p] == 0, sg.grid[p] != sg.grid[q]))

        # Each arrow points to the largest neighbor
        for p, symbol in puzzle.symbols.items():
            (v,) = symbol.get_arrows()
            for n in sg.edge_sharing_neighbors(p):
                if n.direction != v:
                    sg.solver.add(sg.grid[p.translate(v)] > n.symbol)

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != 0:
                solution.texts[p] = solved_grid[p]
