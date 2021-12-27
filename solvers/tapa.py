from itertools import groupby, product
from solvers.utils import *

NEIGHBOR_DIRS = (Vector(0, 1), Vector(1, 1), Vector(1, 0), Vector(1, -1),
                 Vector(0, -1), Vector(-1, -1), Vector(-1, 0), Vector(-1, 1))


# Get all 8-tuples of valid colorings of a square's 8 neighbors.
def _valid_neighbor_colors(desired_block_sizes):
    if desired_block_sizes == [len(NEIGHBOR_DIRS)]:
        return [1] * len(NEIGHBOR_DIRS)
    valid_neighbor_colors = set()
    for colors in product(*[[0, 1]] * (len(NEIGHBOR_DIRS) - 1) + [[0]]):
        block_sizes = [len(list(g)) for k, g in groupby(colors) if k == 1]
        if sorted(block_sizes) == sorted(desired_block_sizes):
            for rotation in range(len(NEIGHBOR_DIRS)):
                valid_neighbor_colors.add(colors[rotation:] + colors[:rotation])
    return valid_neighbor_colors


class TapaSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/tapa/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row, col)]].label if self.grid[row][col] == '.'
                   else self.grid[row][col] for col in range(self.width)] for row in range(self.height)]
        return f'pzprv3/tapa/{self.height}/{self.width}/{table(result)}/'

    def lattice(self):
        return RectangularLattice(
            [Point(row, col) for row in range(-1, self.height + 1) for col in range(-1, self.width + 1)])

    def symbol_set(self):
        return SymbolSet([("WHITE", "+"), ("BLACK", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            if p.x == -1 or p.x == self.width or p.y == -1 or p.y == self.height:
                # Add sentinel WHITE squares around the grid, to avoid special-case logic for edges
                sg.solver.add(sg.cell_is(p, symbol_set.WHITE))
            else:
                nums = self.grid[p.y][p.x]
                if nums != '.':
                    # A square with numbers must be WHITE
                    sg.solver.add(sg.cell_is(p, symbol_set.WHITE))

                    # A square with numbers must have a valid coloring of its neighbors
                    block_sizes = [int(num) for num in nums.split(',')]
                    choices = []
                    for neighbor_colors in _valid_neighbor_colors(block_sizes):
                        choices.append(And(
                            [sg.cell_is(p.translate(v), neighbor_colors[i]) for i, v in enumerate(NEIGHBOR_DIRS)]))
                    sg.solver.add(Or(choices))

        continuous_region(sg, rc, symbol_set.BLACK)
        no2x2(sg, symbol_set.BLACK)
