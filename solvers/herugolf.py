from lib import *


class Herugolf(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = PathSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        pc = PathConstrainer(sg, allow_loops=False)

        # All paths start at a circle and end at a hole ('H')
        for p in sg.grid:
            sg.solver.add((p in puzzle.texts) == symbol_set.is_terminal(sg.grid[p]))
            sg.solver.add((puzzle.texts.get(p) == "H") == (pc.path_order_grid[p] == 0))

        # Balls move along straight line segments with lengths decreasing by 1
        straight_lines = [symbol_set.symbol_for_direction_pair(*v) for v in straight_edge_sharing_direction_pairs(sg)]
        max_number = max(number for p, number in puzzle.texts.items() if number != "H")
        distances = {p: var() for p in sg.grid}
        for p in sg.grid:
            if p in puzzle.texts and puzzle.texts[p] != "H":
                sg.solver.add(distances[p] == puzzle.texts[p])

            sg.solver.add(Implies(distances[p] == 0, symbol_set.is_terminal(sg.grid[p])))
            if puzzle.texts.get(p) != "H":
                for distance in range(1, max_number + 1):
                    choices = []
                    for v in sg.lattice.edge_sharing_directions():
                        line = sight_line(sg, p, v)
                        if distance < len(line):
                            choices.append(
                                And(
                                    sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)),
                                    *[
                                        And(distances[q] == -1, sg.cell_is_one_of(q, straight_lines))
                                        for q in line[1:distance]
                                    ],
                                    distances[line[distance]] == distance - 1
                                )
                            )
                    sg.solver.add(Implies(distances[p] == distance, Or(choices)))

        # Paths cannot go through shaded areas
        for p in puzzle.shaded:
            sg.solver.add(sg.grid[p] == symbol_set.EMPTY)

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
