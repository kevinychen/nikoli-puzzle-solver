from lib import *


class DosunFuwari(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 2))

        for p in puzzle.shaded:
            sg.solver.add(sg.grid[p] == 0)

        # Each region has one white circle and one black circle
        for region in puzzle.regions():
            region = [p for p in region if p not in puzzle.shaded]
            if region:
                for i in (1, 2):
                    sg.solver.add(Sum([sg.grid[p] == i for p in region]) == 1)

        for p in sg.grid:
            # Each white circle must be on the top row, under a shaded cell, or under another white circle
            q = p.translate(Directions.N)
            if q in sg.grid and q not in puzzle.shaded:
                sg.solver.add(Implies(sg.grid[p] == 1, sg.grid[q] == 1))

            # Each black circle must be on the bottom row, over a shaded cell, or over another black circle
            q = p.translate(Directions.S)
            if q in sg.grid and q not in puzzle.shaded:
                sg.solver.add(Implies(sg.grid[p] == 2, sg.grid[q] == 2))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != 0:
                solution.symbols[p] = Symbol(solved_grid[p], "circle_L")
