from lib import *


class Anglers(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice(border=True)
        symbol_set = PathSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        pc = PathConstrainer(sg, allow_loops=False)

        # All paths start at a number
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(symbol_set.is_terminal(sg.grid[p]))

                # The number represents the length of the path
                if type(puzzle.texts[p]) == int:
                    sg.solver.add(pc.path_order_grid[p] == puzzle.texts[p])
            else:
                sg.solver.add(sg.grid[p] == symbol_set.EMPTY)

        # All paths end at a fish
        for p in sg.grid:
            sg.solver.add((p in puzzle.symbols) == (pc.path_order_grid[p] == 0))

        # All squares must be filled
        for p in puzzle.points:
            sg.solver.add(sg.grid[p] != symbol_set.EMPTY)

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
