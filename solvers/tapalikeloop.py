from itertools import permutations
from solvers.utils import *

NEIGHBOR_DIRS = (Vector(0, 1), Vector(1, 1), Vector(1, 0), Vector(1, -1),
                 Vector(0, -1), Vector(-1, -1), Vector(-1, 0), Vector(-1, 1))


class TapaLikeLoopSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/tapaloop/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        horizontals = [['1' if 'E' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                        for col in range(self.width - 1)] for row in range(self.height)]
        verticals = [['1' if 'S' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                      for col in range(self.width)] for row in range(self.height - 1)]
        return f'pzprv3/tapaloop/{self.height}/{self.width}/{table(self.grid)}/{table(horizontals)}/{table(verticals)}/'

    def lattice(self):
        return RectangularLattice(
            [Point(row, col) for row in range(-1, self.height + 1) for col in range(-1, self.width + 1)])

    def symbol_set(self):
        symbol_set = LoopSymbolSet(self.lattice())
        symbol_set.append('empty', ' ')
        return symbol_set

    def configure(self, sg):
        symbol_set = self.symbol_set()
        donut_parts = [symbol_set.NS, symbol_set.NW, symbol_set.EW, symbol_set.NE,
                       symbol_set.NS, symbol_set.SE, symbol_set.EW, symbol_set.SW]
        LoopConstrainer(sg, single_loop=True)

        for p in sg.lattice.points:
            if p.x == -1 or p.x == self.width or p.y == -1 or p.y == self.height:
                # Add sentinel empty squares around the grid, to avoid special-case logic for edges
                sg.solver.add(sg.cell_is(p, symbol_set.empty))
            else:
                nums = self.grid[p.y][p.x]
                if nums != '.':
                    # A square with numbers must be empty
                    sg.solver.add(sg.cell_is(p, symbol_set.empty))

                    # A square with numbers must have valid loop segments around it
                    segment_lens = [int(num) for num in nums.split(',')]
                    choices = []
                    for loop_entrances in permutations(range(8), len(segment_lens)):
                        processed_squares = list()
                        requirements = []
                        for segment_len, loop_entrance in zip(segment_lens, loop_entrances):
                            for i in range(segment_len):
                                loop_dir = (loop_entrance + i) % 8
                                square = p.translate(NEIGHBOR_DIRS[loop_dir])
                                processed_squares.append(square)
                                requirements.append(
                                    sg.cell_is(square, donut_parts[loop_dir]) == (0 < i < segment_len - 1))
                        for square in sg.lattice.vertex_sharing_points(p):
                            requirements.append(sg.cell_is(square, symbol_set.empty) != (square in processed_squares))
                        if len(processed_squares) == len(set(processed_squares)):
                            choices.append(And(requirements))
                    sg.solver.add(Or(choices))
