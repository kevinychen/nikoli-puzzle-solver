from lib import *


class CrossTheStreams(AbstractSolver):
    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if p not in puzzle.points:
                sg.solver.add(sg.grid[p] == 0)

        lines = []
        for p, v in puzzle.entrance_points():
            lines.append(
                (
                    [puzzle.texts[q] for q in sight_line(sg, p, v.vector.negate(), lambda q: q in puzzle.texts)][::-1],
                    sight_line(sg, p, v),
                )
            )

        # For each horizontal/vertical line, use dynamic programming where num_blocks[i] is the current number of
        # blocks seen so far. Then anytime we end a block, we check if the block is the right size and increment
        # num_blocks[i] if so. Otherwise, we keep num_blocks[i] as the same value. If the incremented value now
        # corresponds to a '*', then we can increment again, supporting any square color in the meantime. For '?', we
        # need only check that the previous square is black (it doesn't matter how long the block is).
        for block_sizes, line in lines:
            if not block_sizes:
                continue
            num_blocks = [var() for _ in line]
            for i in range(1, len(line)):
                choices = [
                    And(num_blocks[i] == num_blocks[i - 1], Or(sg.grid[line[i - 1]] == 0, sg.grid[line[i]] == 1))
                ]
                for block_num, block_size in enumerate(block_sizes):
                    next_block_num = block_num + (
                        2 if block_num + 1 < len(block_sizes) and block_sizes[block_num + 1] == "*" else 1
                    )
                    if block_size == "?":
                        choices.append(
                            And(
                                num_blocks[i] == next_block_num,
                                num_blocks[i - 1] == block_num,
                                sg.grid[line[i]] == 0,
                                sg.grid[line[i - 1]] == 1,
                            )
                        )
                    elif block_size == "*":
                        choices.append(And(num_blocks[i] == block_num + 1, num_blocks[i - 1] == block_num + 1))
                    elif block_size < i:
                        choices.append(
                            And(
                                num_blocks[i] == next_block_num,
                                num_blocks[i - block_size] == block_num,
                                sg.grid[line[i]] == 0,
                                *[sg.grid[line[i - j - 1]] == 1 for j in range(block_size)],
                                sg.grid[line[i - block_size - 1]] == 0
                            )
                        )
                sg.solver.add(Or(choices))
            sg.solver.add(num_blocks[0] == (1 if block_sizes[0] == "*" else 0))
            sg.solver.add(num_blocks[-1] == len(block_sizes))

        continuous_region(sg, rc, lambda q: sg.grid[q] == 1)
        no2x2(sg, lambda q: sg.grid[q] == 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
