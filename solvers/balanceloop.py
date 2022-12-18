from itertools import combinations

from lib import *


class BalanceLoop(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")
        straight_lines = [
            symbol_set.symbol_for_direction_pair(*v)
            for v in puzzle.lattice_type.straight_edge_sharing_direction_pairs()
        ]
        circles = [p for p in puzzle.symbols if puzzle.symbols[p].is_circle()]

        sg = SymbolGrid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        for p in circles:
            # Each circle must have two "arms". Try all possibilities of lengths of these arms, subject to constraints.
            choices = []
            for dir1, dir2 in combinations(sg.lattice.edge_sharing_directions(), 2):
                line1, line2 = sight_line(sg, p, dir1), sight_line(sg, p, dir2)
                for len1 in range(1, len(line1)):
                    for len2 in range(1, len(line2)):
                        if not puzzle.symbols[p].is_black() and len1 != len2:
                            continue
                        if puzzle.symbols[p].is_black() and len1 == len2:
                            continue
                        if p in puzzle.texts and len1 + len2 != puzzle.texts[p]:
                            continue
                        choices.append(
                            And(
                                sg.cell_is_one_of(
                                    p, [i for i, s in symbol_set.symbols.items() if s.name == dir1.name + dir2.name]
                                ),
                                *[sg.cell_is_one_of(q, straight_lines) for q in line1[1:len1]],
                                Not(sg.cell_is_one_of(line1[len1], straight_lines)),
                                *[sg.cell_is_one_of(q, straight_lines) for q in line2[1:len2]],
                                Not(sg.cell_is_one_of(line2[len2], straight_lines))
                            )
                        )
            sg.solver.add(Or(choices))

        # Optimization: loop starts at one of the circles
        sg.solver.add(lc.loop_order_grid[circles[0] or sg.lattice.points[0]] == 0)

        solved_grid, solution = solve(sg)
        solution.set_loop(sg, solved_grid)
