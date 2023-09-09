from lib import *


class Linesweeper(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        # Each number represents the number of neighboring squares that are part of the loop
        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == symbol_set.EMPTY)
            sg.solver.add(Sum([n.symbol != symbol_set.EMPTY for n in sg.vertex_sharing_neighbors(p)]) == number)

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
