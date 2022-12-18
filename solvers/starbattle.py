from lib import *


class StarBattle(AbstractSolver):
    def run(self, puzzle, solve):
        num_stars = puzzle.parameters["stars"]

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, v in puzzle.entrance_points():
            sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == num_stars)
        for region in puzzle.regions():
            sg.solver.add(Sum([sg.grid[p] for p in region]) == num_stars)

        no_adjacent_symbols(sg, 1, no_diagonal=True)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            solution.symbols[p] = Symbols.STAR if solved_grid[p] else Symbols.X
