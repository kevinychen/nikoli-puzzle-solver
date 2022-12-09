from solvers.utils import *


class EasyAsABC(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        letters = puzzle.parameters['letters']

        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, len(letters)))

        border_lines = []
        for i in range(puzzle.height):
            border_lines.append((Point(i, -1), Directions.E))
            border_lines.append((Point(i, puzzle.width), Directions.W))
        for i in range(puzzle.width):
            border_lines.append((Point(-1, i), Directions.S))
            border_lines.append((Point(puzzle.height, i), Directions.N))

        # Each border letter is the first one visible on that line
        for p, v in border_lines:
            if p in puzzle.texts:
                line = sight_line(sg, p.translate(v), v)
                sg.solver.add(Or([
                    And(sg.grid[q] == letters.index(puzzle.texts[p]) + 1, *[sg.grid[r] == 0 for r in line[:i]])
                    for i, q in enumerate(line)]))

        # Each letter appears in each row and in each column exactly once
        for i in range(1, len(letters) + 1):
            for row in range(puzzle.height):
                sg.solver.add(Sum([sg.grid[Point(row, col)] == i for col in range(puzzle.width)]) == 1)
            for col in range(puzzle.width):
                sg.solver.add(Sum([sg.grid[Point(row, col)] == i for row in range(puzzle.height)]) == 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        letters = puzzle.parameters['letters']

        for p in sg.grid:
            if p not in puzzle.texts:
                if solved_grid[p] > 0:
                    solution.texts[p] = letters[solved_grid[p] - 1]
                else:
                    solution.shaded[p] = True
