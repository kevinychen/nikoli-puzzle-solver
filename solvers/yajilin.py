from lib import *


class Yajilin(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("BLACK")
        symbol_set.append("WALL")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        for p in sg.grid:
            if p in puzzle.texts and p in puzzle.symbols:
                sg.solver.add(sg.grid[p] == symbol_set.WALL)
                (v,) = puzzle.symbols[p].get_arrows()
                sg.solver.add(Sum([sg.grid[q] == symbol_set.BLACK for q in sight_line(sg, p, v)]) == puzzle.texts[p])
            elif p in puzzle.shaded:
                sg.solver.add(sg.grid[p] == symbol_set.WALL)
            else:
                sg.solver.add(sg.grid[p] != symbol_set.WALL)

        no_adjacent_symbols(sg, symbol_set.BLACK)

        solved_grid, solution = solve(sg)
        solution.set_loop(sg, solved_grid)
        for p in sg.grid:
            if solved_grid[p] == symbol_set.BLACK:
                solution.shaded[p] = True
