from lib import *


class Masyu(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        crossing_dir_pairs = straight_edge_sharing_direction_pairs(sg)
        straight_lines = [symbol_set.symbol_for_direction_pair(*v) for v in crossing_dir_pairs]
        circles = [p for p in puzzle.symbols if puzzle.symbols[p].is_circle()]
        for p in circles:
            if puzzle.symbols[p].is_black():
                # Must turn on black, but both arms must be straight lines
                sg.solver.add(And(Not(sg.cell_is_one_of(p, straight_lines)), sg.grid[p] != symbol_set.EMPTY))
                for n in sg.edge_sharing_neighbors(p):
                    sg.solver.add(
                        Implies(
                            sg.cell_is_one_of(p, symbol_set.symbols_for_direction(n.direction)),
                            sg.cell_is_one_of(n.location, straight_lines),
                        )
                    )
            else:
                # Must be straight on white, but at least one neighbor must not be a straight line
                sg.solver.add(sg.cell_is_one_of(p, straight_lines))
                for v, w in crossing_dir_pairs:
                    if p.translate(v) in sg.grid and p.translate(w) in sg.grid:
                        sg.solver.add(
                            Implies(
                                sg.grid[p] == symbol_set.symbol_for_direction_pair(v, w),
                                Or(
                                    Not(sg.cell_is_one_of(p.translate(v), straight_lines)),
                                    Not(sg.cell_is_one_of(p.translate(w), straight_lines)),
                                ),
                            )
                        )

        # Optimization: loop starts at one of the circles
        sg.solver.add(lc.loop_order_grid[circles[0] if circles else sg.lattice.points[0]] == 0)

        solved_grid, solution = solve(sg)
        solution.set_loop(sg, solved_grid)
