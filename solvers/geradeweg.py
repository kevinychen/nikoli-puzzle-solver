from itertools import combinations

from lib import *


class Geradeweg(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        straight_lines = [symbol_set.symbol_for_direction_pair(*v) for v in straight_edge_sharing_direction_pairs(sg)]
        for p, number in puzzle.texts.items():
            # Each number represents either the total length, or both lengths of two lines meeting at a corner
            segment_lens = []
            for dir1, dir2 in combinations(sg.lattice.edge_sharing_directions(), 2):
                if dir2 == sg.lattice.opposite_direction(dir1):
                    for i in range(1, number):
                        segment_lens.append((dir1, dir2, i, number - i))
                else:
                    segment_lens.append((dir1, dir2, number, number))

            choices = []
            for dir1, dir2, len1, len2 in segment_lens:
                line1, line2 = sight_line(sg, p, dir1), sight_line(sg, p, dir2)
                if len(line1) > len1 and len(line2) > len2:
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
        sg.solver.add(lc.loop_order_grid[next(iter(puzzle.texts), sg.lattice.points[0])] == 0)

        solved_grid, solution = solve(sg)
        solution.set_loop(sg, solved_grid)
