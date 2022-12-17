from lib import *


class EasyAsABC(AbstractSolver):
    def configure(self, puzzle, init_symbol_grid):
        letters = puzzle.parameters["letters"]

        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(letters)))

        # Each border letter is the first one visible on that line
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                line = sight_line(sg, p.translate(v), v)
                sg.solver.add(
                    Or(
                        [
                            And(sg.grid[q] == letters.index(puzzle.texts[p]) + 1, *[sg.grid[r] == 0 for r in line[:i]])
                            for i, q in enumerate(line)
                        ]
                    )
                )

        # Each given letter is correct
        for p, text in puzzle.texts.items():
            if p in puzzle.points:
                sg.solver.add(sg.grid[p] == letters.index(text))

        # Each letter appears in each row and in each column exactly once
        for i in range(1, len(letters) + 1):
            for p, v in puzzle.entrance_points():
                sg.solver.add(Sum([sg.grid[q] == i for q in sight_line(sg, p.translate(v), v)]) == 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        letters = puzzle.parameters["letters"]

        for p in sg.grid:
            if p not in puzzle.texts:
                if solved_grid[p] > 0:
                    solution.texts[p] = letters[solved_grid[p] - 1]
                else:
                    solution.shaded[p] = True
