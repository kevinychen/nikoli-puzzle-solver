from lib import *


class Doppelblock(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, puzzle.width - 2))

        for p, v in puzzle.entrance_points():
            line = sight_line(sg, p.translate(v), v)
            if p in puzzle.texts:
                choices = []
                for block1 in range(puzzle.width):
                    for block2 in range(block1 + 1, puzzle.width):
                        choices.append(
                            And(
                                sg.grid[line[block1]] == 0,
                                sg.grid[line[block2]] == 0,
                                Sum([sg.grid[q] for q in line[block1 + 1 : block2]]) == puzzle.texts[p],
                            )
                        )
                sg.solver.add(Or(choices))

        # Each number appears in each row and in each column exactly once
        for i in range(1, puzzle.width - 1):
            for p, v in puzzle.entrance_points():
                sg.solver.add(Sum([sg.grid[q] == i for q in sight_line(sg, p.translate(v), v)]) == 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] > 0:
                solution.texts[p] = solved_grid[p]
            elif p in puzzle.points:
                solution.shaded[p] = True
