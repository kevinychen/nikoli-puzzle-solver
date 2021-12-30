from solvers.utils import *


class AquariumSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/aquarium/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.verticals = parse_table(matched.group(3))[:self.height]
        self.horizontals = parse_table(matched.group(3))[self.height:2 * self.height - 1]
        self.grid = parse_table(matched.group(3))[2 * self.height - 1:]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row - 1, col - 1)]].label if row > 0 and col > 0
                   else self.grid[row][col] for col in range(self.width + 1)] for row in range(self.height + 1)]
        return (
            'pzprv3/aquarium/'
            f'{self.height}/{self.width}/{table(self.verticals)}/{table(self.horizontals)}/{table(result)}/')

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return SymbolSet([("EMPTY", "+"), ("WATER", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()

        # Each region must have all water at the same level
        for region in convert_pzprv3_borders_to_regions(sg, self.verticals, self.horizontals):
            sg.solver.add(Or(
                [And([sg.cell_is(p, symbol_set.WATER if p.y >= height else symbol_set.EMPTY) for p in region])
                 for height in range(self.height + 1)]))

        # Satisfy WATER counts
        border_lines = []
        for row in range(self.height):
            border_lines.append((Point(row, -1), Vector(0, 1)))
        for col in range(self.width):
            border_lines.append((Point(-1, col), Vector(1, 0)))
        for p, v in border_lines:
            num = self.grid[p.y + 1][p.x + 1]
            if num.isnumeric():
                sg.solver.add(PbEq(
                    [(sg.cell_is(q, symbol_set.WATER), 1) for q in sight_line(sg, p.translate(v), v)], int(num)))
