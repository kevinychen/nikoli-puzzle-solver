from lib import *


class JapaneseSums(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        maximum = int(puzzle.parameters['maximum'])

        sg = init_symbol_grid(
            RectangularLattice(
                [Point(row, col) for row in range(-puzzle.height, puzzle.height + 1)
                 for col in range(-puzzle.width, puzzle.width + 1)]),
            grilops.make_number_range_symbol_set(0, maximum))

        for p in sg.grid:
            if p not in puzzle.points:
                sg.solver.add(sg.grid[p] == 0)

        lines = []
        for p, v in puzzle.entrance_points():
            lines.append((
                [puzzle.texts[q] for q in sight_line(sg, p, v.vector.negate(), lambda q: q in puzzle.texts)][::-1],
                sight_line(sg, p, v)))

        # For each horizontal/vertical line, use dynamic programming where num_blocks[i] is the current number of
        # blocks seen so far. Then anytime we end a block, we check if the block is the right sum and increment
        # num_blocks[i] if so. Otherwise, we keep num_blocks[i] as the same value.
        for block_sums, line in lines:
            if not block_sums:
                continue
            num_blocks = [var() for _ in line]
            for i in range(1, len(line)):
                choices = [And(
                    num_blocks[i] == num_blocks[i - 1],
                    Or(sg.grid[line[i - 1]] == 0, Not(sg.grid[line[i]] == 0)))]
                for block_num, block_sum in enumerate(block_sums):
                    for block_size in range(1, i):
                        squares = [sg.grid[line[i - j - 1]] for j in range(block_size)]
                        choices.append(And(num_blocks[i] == block_num + 1,
                                           num_blocks[i - block_size] == block_num,
                                           sg.grid[line[i]] == 0,
                                           *[square != 0 for square in squares],
                                           True if block_sum == '?' else Sum(squares) == block_sum,
                                           sg.grid[line[i - block_size - 1]] == 0))
                sg.solver.add(Or(choices))
            sg.solver.add(num_blocks[0] == 0)
            sg.solver.add(num_blocks[-1] == len(block_sums))

        # Each number appears in each row and in each column exactly once
        for i in range(1, maximum + 1):
            for p, v in puzzle.entrance_points():
                sg.solver.add(Sum([sg.grid[q] == i for q in sight_line(sg, p.translate(v), v)]) <= 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] > 0:
                solution.texts[p] = solved_grid[p]
            elif p in puzzle.points:
                solution.shaded[p] = True
