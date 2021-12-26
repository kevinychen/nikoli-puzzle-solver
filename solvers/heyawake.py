from solvers.utils import *


class HeyawakeSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/heyawake/(\\d+)/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.num_regions = int(matched.group(3))
        parsed_table = parse_table(matched.group(4))
        self.regions = parsed_table[:self.height]
        self.nums = parsed_table[self.height:2 * self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return (
            f'pzprv3/heyawake/'
            f'{self.height}/{self.width}/{self.num_regions}/{table(self.regions)}/{table(self.nums)}/{table(result)}/')

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return SymbolSet([("WHITE", "+"), ("BLACK", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()
        rc = RegionConstrainer(sg.lattice, sg.solver)

        # No "word", i.e. line of white squares visiting at least three regions
        for v in Vector(0, 1), Vector(1, 0):
            for p in sg.lattice.points:
                word = []
                while p in sg.grid:
                    word.append(p)
                    if len(set(self.regions[q.y][q.x] for q in word)) >= 3:
                        sg.solver.add(Or([sg.cell_is(q, symbol_set.BLACK) for q in word]))
                        break
                    p = p.translate(v)

        # Number of black squares in each region is correct
        for p in sg.lattice.points:
            num = self.nums[p.y][p.x]
            if num.isnumeric():
                sg.solver.add(Sum([sg.grid[q] for q in sg.lattice.points
                                   if self.regions[q.y][q.x] == self.regions[p.y][p.x]]) == int(num))

        # No two black squares may be adjacent
        for p in sg.lattice.points:
            for color in sg.edge_sharing_neighbors(p):
                sg.solver.add(Or(sg.cell_is(p, symbol_set.WHITE), color.symbol == symbol_set.WHITE))

        continuous_region(sg, rc, symbol_set.WHITE)
