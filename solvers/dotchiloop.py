from lib import *


class DotchiLoop(AbstractSolver):
    def run(self, puzzle, solve):
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])

        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        # In each region, the line either goes straight through all white circles or bends through all white circles
        is_straights = [var() for _ in puzzle.regions()]
        for is_straight in is_straights:
            sg.solver.add(Or(is_straight == 0, is_straight == 1))

        # Loop goes through all white circles and no black circles
        straight_lines = [symbol_set.symbol_for_direction_pair(*v) for v in straight_edge_sharing_direction_pairs(sg)]
        for p, symbol in puzzle.symbols.items():
            if symbol.is_black():
                sg.solver.add(sg.grid[p] == symbol_set.EMPTY)
            else:
                sg.solver.add(sg.grid[p] != symbol_set.EMPTY)
                sg.solver.add(sg.cell_is_one_of(p, straight_lines) == is_straights[regions[p]])

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
