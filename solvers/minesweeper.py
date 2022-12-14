from lib import *


class Minesweeper(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.cell_is(p, 0))
            sg.solver.add(Sum([is_mine.symbol for is_mine in sg.vertex_sharing_neighbors(p)]) == number)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.symbols[p] = Symbols.BOMB if solved_grid[p] else Symbols.X
