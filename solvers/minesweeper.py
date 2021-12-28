from solvers.utils import *


class MinesweeperSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/mines/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return f'pzprv3/mines/{self.height}/{self.width}/{table(self.grid)}/{table(result)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return SymbolSet([("EMPTY", "+"), ("MINE", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()

        for p in sg.lattice.points:
            num = self.grid[p.y][p.x]
            if num.isnumeric():
                sg.solver.add(sg.cell_is(p, symbol_set.EMPTY))
                sg.solver.add(Sum([is_mine.symbol for is_mine in sg.vertex_sharing_neighbors(p)]) == int(num))
