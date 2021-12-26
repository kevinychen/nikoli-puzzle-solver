from solvers.utils import *


class StarBattleSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/starbattle/(\\d+)/(\\d+)/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.num_stars = int(matched.group(3))
        self.num_regions = int(matched.group(4))
        self.grid = parse_table(matched.group(5))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return (
            'pzprv3/starbattle/'
            f'{self.height}/{self.width}/{self.num_stars}/{self.num_regions}/{table(self.grid)}/{table(result)}/')

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return SymbolSet([("EMPTY", "+"), ("STAR", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()

        for row in range(self.height):
            sg.solver.add(Sum([sg.grid[Point(row, col)] for col in range(self.width)]) == self.num_stars)
        for col in range(self.width):
            sg.solver.add(Sum([sg.grid[Point(row, col)] for row in range(self.height)]) == self.num_stars)
        for i in range(self.num_regions):
            sg.solver.add(
                Sum([sg.grid[p] for p in sg.lattice.points if self.grid[p.y][p.x] == str(i)]) == self.num_stars)

        # No two stars may be adjacent
        for p in sg.lattice.points:
            for is_star in sg.edge_sharing_neighbors(p):
                sg.solver.add(Or(sg.cell_is(p, symbol_set.EMPTY), is_star.symbol == symbol_set.EMPTY))
            for is_star in sg.vertex_sharing_neighbors(p):
                sg.solver.add(Or(sg.cell_is(p, symbol_set.EMPTY), is_star.symbol == symbol_set.EMPTY))
