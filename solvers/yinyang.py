from solvers.utils import *


class YinYangSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/yinyang/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [['.' if self.grid[row][col].isnumeric() else symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return f'pzprv3/yinyang/{self.height}/{self.width}/{table(self.grid)}/{table(result)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return SymbolSet([("WHITE", "1"), ("BLACK", "2")])

    def configure(self, sg):
        symbol_set = self.symbol_set()
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            num = self.grid[p.y][p.x]
            if num == '1':
                sg.solver.add(sg.cell_is(p, symbol_set.WHITE))
            elif num == '2':
                sg.solver.add(sg.cell_is(p, symbol_set.BLACK))

        continuous_region(sg, rc, lambda q: sg.cell_is(q, symbol_set.WHITE))
        continuous_region(sg, rc, lambda q: sg.cell_is(q, symbol_set.BLACK))

        no2x2(sg, symbol_set.WHITE)
        no2x2(sg, symbol_set.BLACK)
