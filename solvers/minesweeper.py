from lib import *


class Minesweeper(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == 0)
            sg.solver.add(Sum([is_mine.symbol for is_mine in sg.vertex_sharing_neighbors(p)]) == number)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.symbols[p] = Symbols.BOMB if solved_grid[p] else Symbols.X
