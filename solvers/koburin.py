from lib import *


class Koburin(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("BLACK")
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        for p in sg.grid:
            sg.solver.add((p in puzzle.texts) == (sg.grid[p] == symbol_set.EMPTY))

        # Numbers are white and represent the number of orthogonally adjacent black cells
        for p, number in puzzle.texts.items():
            if type(number) == int:
                sg.solver.add(Sum([n.symbol == symbol_set.BLACK for n in sg.edge_sharing_neighbors(p)]) == number)

        no_adjacent_symbols(sg, symbol_set.BLACK)

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
        for p in sg.grid:
            if solved_grid[p] == symbol_set.BLACK:
                solution.shaded[p] = True
