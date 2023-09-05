from lib import *


class MidLoop(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        # Lines must go straight through dots, which is the midpoint of the line through the dot
        dots = {}
        for p in puzzle.symbols:
            dots[p, p] = straight_edge_sharing_direction_pairs(sg)
        for p, q in puzzle.junction_symbols:
            v = next(v for v in sg.lattice.edge_sharing_directions() if p.translate(v) == q)
            dots[p, q] = [(v, sg.lattice.opposite_direction(v))]
        for (p, q), dirs in dots.items():
            choices = []
            for v, w in dirs:
                straight_line = symbol_set.symbol_for_direction_pair(v, w)
                line1, line2 = sight_line(sg, p, v), sight_line(sg, q, w)
                for i in range(1, min(len(line1), len(line2))):
                    choices.append(
                        And(
                            sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)),
                            *[sg.grid[r] == straight_line for r in line1[1:i]],
                            sg.grid[line1[i]] != straight_line,
                            *[sg.grid[r] == straight_line for r in line2[1:i]],
                            sg.grid[line2[i]] != straight_line
                        )
                    )
            sg.solver.add(Or(choices))

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
