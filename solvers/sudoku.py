from lib import *


class Sudoku(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        for p, v in puzzle.entrance_points():
            sg.solver.add(Distinct([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]))
        for region in puzzle.regions():
            sg.solver.add(Distinct([sg.grid[p] for p in region]))

        # Handle Killer Sudoku cages
        for cage in puzzle.cages:
            total = next(number for (p, _), number in puzzle.edge_texts.items() if p in cage)
            sg.solver.add(Sum([sg.grid[p] for p in cage]) == total)
            sg.solver.add(Distinct([sg.grid[p] for p in cage]))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
