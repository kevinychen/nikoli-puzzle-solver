from lib import *


class Satogaeri(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = PathSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        pc = PathConstrainer(sg, allow_loops=False)

        # All paths are straight
        straight_lines = [symbol_set.symbol_for_direction_pair(*v) for v in straight_edge_sharing_direction_pairs(sg)]
        for p in sg.grid:
            sg.solver.add(Or(Not(symbol_set.is_path_segment(sg.grid[p])), sg.cell_is_one_of(p, straight_lines)))

        # All paths start at a circle
        for p in sg.grid:
            if p in puzzle.symbols:
                sg.solver.add(Or(sg.grid[p] == symbol_set.EMPTY, symbol_set.is_terminal(sg.grid[p])))
            else:
                sg.solver.add(Implies(symbol_set.is_terminal(sg.grid[p]), pc.path_order_grid[p] == 0))

        # Numbers represent the distance the circle moves
        for p, number in puzzle.texts.items():
            if number == 0:
                sg.solver.add(sg.grid[p] == symbol_set.EMPTY)
            else:
                sg.solver.add(pc.path_order_grid[p] == number)

        # Each region has one moved circle
        for region in puzzle.regions():
            sg.solver.add(
                Sum(
                    [
                        If(p in puzzle.symbols, sg.grid[p] == symbol_set.EMPTY, symbol_set.is_terminal(sg.grid[p]))
                        for p in region
                    ]
                )
                == 1
            )

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
