from lib import *


class Numberlink(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = PathSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        pc = PathConstrainer(sg, allow_loops=False)

        # Each path connects two symbols
        for p in sg.grid:
            sg.solver.add(symbol_set.is_terminal(sg.grid[p]) == (p in puzzle.texts))

        # Identical symbols are on the same path
        for p, text1 in puzzle.texts.items():
            for q, text2 in puzzle.texts.items():
                if text1 == text2:
                    sg.solver.add(pc.path_instance_grid[p] == pc.path_instance_grid[q])

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
