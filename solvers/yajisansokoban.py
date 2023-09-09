from lib import *


class YajisanSokoban(AbstractSolver):
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

        # All paths start at a square
        for p in sg.grid:
            if p in puzzle.symbols and puzzle.symbols[p].is_square():
                sg.solver.add(Or(sg.grid[p] == symbol_set.EMPTY, symbol_set.is_terminal(sg.grid[p])))
            else:
                sg.solver.add(Implies(symbol_set.is_terminal(sg.grid[p]), pc.path_order_grid[p] == 0))

        # Each number (if not covered by a square) represents the number of squares in the given direction
        for p, number in puzzle.texts.items():
            (v,) = puzzle.symbols[p].get_arrows()
            sg.solver.add(
                Or(
                    pc.path_order_grid[p] == 0,
                    Sum(
                        [
                            Or(
                                q in puzzle.symbols
                                and puzzle.symbols[q].is_square()
                                and sg.grid[q] == symbol_set.EMPTY,
                                pc.path_order_grid[q] == 0,
                            )
                            for q in sight_line(sg, p, v)
                        ]
                    )
                    == puzzle.texts[p],
                )
            )

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
