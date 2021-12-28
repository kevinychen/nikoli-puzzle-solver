from solvers.utils import *


class NonogramSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/nonogram/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))
        self.num_vertical_nums = len(self.grid) - self.height
        self.num_horizontal_nums = len(self.grid[0]) - self.width

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[
            symbol_set.symbols[solved_grid[Point(row - self.num_vertical_nums, col - self.num_horizontal_nums)]].label
            if row >= self.num_vertical_nums and col >= self.num_horizontal_nums else self.grid[row][col]
            for col in range(len(self.grid[row]))] for row in range(len(self.grid))]
        return f'pzprv3/nonogram/{self.height}/{self.width}/{table(result)}/'

    def lattice(self):
        return RectangularLattice(
            [Point(row, col) for row in range(-1, self.height + 1) for col in range(-1, self.width + 1)])

    def symbol_set(self):
        return SymbolSet([("WHITE", "+"), ("BLACK", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()

        for p in sg.lattice.points:
            if p.x == -1 or p.x == self.width or p.y == -1 or p.y == self.height:
                # Add sentinel WHITE squares around the grid, to avoid special-case logic for edges
                sg.solver.add(sg.cell_is(p, symbol_set.WHITE))

        lines = []
        for row in range(self.height):
            lines.append((
                [self.grid[self.num_vertical_nums + row][col] for col in range(self.num_horizontal_nums)],
                sight_line(sg, Point(row, -1), Vector(0, 1))))
        for col in range(self.width):
            lines.append((
                [self.grid[row][self.num_horizontal_nums + col] for row in range(self.num_vertical_nums)],
                sight_line(sg, Point(-1, col), Vector(1, 0))))

        # For each horizontal/vertical line, use dynamic programming where num_blocks[i] is the current number of black
        # blocks seen so far. Then anytime BLACK changes to WHITE, we check if there are the correct number of adjacent
        # BLACKs and increment num_blocks[i] if so. Otherwise (if we're previously already on WHITE or currently still
        # on BLACK), keep num_blocks[i] as the same value.
        for nums, line in lines:
            block_sizes = [int(num) for num in nums if num.isnumeric()]
            num_blocks = [Int(str(uuid4())) for _ in line]
            for i in range(1, len(line)):
                choices = [And(
                    num_blocks[i] == num_blocks[i - 1],
                    Or(sg.cell_is(line[i - 1], symbol_set.WHITE), sg.cell_is(line[i], symbol_set.BLACK)))]
                for block_num, block_size in enumerate(block_sizes):
                    if block_size < i:
                        choices.append(And(num_blocks[i] == block_num + 1,
                                           num_blocks[i - block_size] == block_num,
                                           sg.cell_is(line[i], symbol_set.WHITE),
                                           *[sg.cell_is(line[i - j - 1], symbol_set.BLACK) for j in range(block_size)],
                                           sg.cell_is(line[i - block_size - 1], symbol_set.WHITE)))
                sg.solver.add(Or(choices))
            sg.solver.add(num_blocks[0] == 0)
            sg.solver.add(num_blocks[-1] == len(block_sizes))
