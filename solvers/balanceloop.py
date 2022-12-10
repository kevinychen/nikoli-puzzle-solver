from itertools import combinations

from lib import *


class BalanceLoop(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        lattice = grilops.get_rectangle_lattice(puzzle.height, puzzle.width)
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append('empty')
        straight_lines = symbol_set.NS, symbol_set.EW

        sg = init_symbol_grid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        circles = [p for p in puzzle.symbols if puzzle.symbols[p].is_circle()]
        for p in circles:
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
                        choices.append(And(
                            sg.cell_is_one_of(
                                p,
                                [i for i, s in symbol_set.symbols.items() if s.name == dir1.name + dir2.name]),
                            *[sg.cell_is_one_of(q, straight_lines) for q in line1[1:len1]],
                            Not(sg.cell_is_one_of(line1[len1], straight_lines)),
                            *[sg.cell_is_one_of(q, straight_lines) for q in line2[1:len2]],
                            Not(sg.cell_is_one_of(line2[len2], straight_lines))))
            sg.solver.add(Or(choices))

        # Optimization: loop starts at one of the circles
        if circles:
            sg.solver.add(lc.loop_order_grid[circles[0]] == 0)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_loop(sg, solved_grid)
