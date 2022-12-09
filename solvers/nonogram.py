from solvers.utils import *


class Nonogram(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            RectangularLattice(
                [Point(row, col) for row in range(-puzzle.top_space, puzzle.height + 1)
                 for col in range(-puzzle.left_space, puzzle.width + 1)]),
            grilops.make_number_range_symbol_set(0, 1))

        for p in sg.grid:
            if not (0 <= p.x < puzzle.width and 0 <= p.y < puzzle.height):
                # Add sentinel white squares around the grid, to avoid special-case logic for edges
                sg.solver.add(sg.cell_is(p, 0))

        lines = []
        for p, v in puzzle.border_lines(Directions.E, Directions.S):
            lines.append((
                [puzzle.texts[q] for q in sight_line(sg, p, v.vector.negate(), lambda q: q in puzzle.texts)][::-1],
                sight_line(sg, p, v)))

        # For each horizontal/vertical line, use dynamic programming where num_blocks[i] is the current number of black
        # blocks seen so far. Then anytime black changes to white, we check if there are the correct number of adjacent
        # blacks and increment num_blocks[i] if so. Otherwise, if we're previously already on white or currently still
        # on black, keep num_blocks[i] as the same value.
        for block_sizes, line in lines:
            num_blocks = [Int(str(uuid4())) for _ in line]
            for i in range(1, len(line)):
                choices = [And(
                    num_blocks[i] == num_blocks[i - 1],
                    Or(sg.cell_is(line[i - 1], 0), sg.cell_is(line[i], 1)))]
                for block_num, block_size in enumerate(block_sizes):
                    if block_size < i:
                        choices.append(And(num_blocks[i] == block_num + 1,
                                           num_blocks[i - block_size] == block_num,
                                           sg.cell_is(line[i], 0),
                                           *[sg.cell_is(line[i - j - 1], 1) for j in range(block_size)],
                                           sg.cell_is(line[i - block_size - 1], 0)))
                sg.solver.add(Or(choices))
            sg.solver.add(num_blocks[0] == 0)
            sg.solver.add(num_blocks[-1] == len(block_sizes))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
