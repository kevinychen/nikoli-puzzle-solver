from lib import *


class DoubleBack(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        for p in sg.grid:
            sg.solver.add((p in puzzle.shaded) == (sg.grid[p] == symbol_set.EMPTY))

        # Each region is visited twice
        for region in puzzle.regions():
            if any(p not in puzzle.shaded for p in region):
                exits = []
                for p in region:
                    for n in sg.edge_sharing_neighbors(p):
                        if (p, n.location) in puzzle.borders:
                            exits.append((p, n.direction))
                sg.solver.add(Sum([sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)) for (p, v) in exits]) == 4)

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
