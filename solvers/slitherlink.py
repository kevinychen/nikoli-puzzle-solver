from solvers.utils import *


class SlitherlinkSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3\\.1/slither/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        zeroes = [['0' for _col in range(self.width)] for _row in range(self.height)]
        verticals = [['0' if solved_grid[Point(row, col - 1)] == solved_grid[Point(row, col)] else '1'
                      for col in range(self.width + 1)] for row in range(self.height)]
        horizontals = [['0' if solved_grid[Point(row - 1, col)] == solved_grid[Point(row, col)] else '1'
                        for col in range(self.width)] for row in range(self.height + 1)]
        return (
            'pzprv3.1/slither/'
            f'{self.height}/{self.width}/{table(self.grid)}/{table(zeroes)}/{table(verticals)}/{table(horizontals)}/')

    def lattice(self):
        return grilops.RectangularLattice(
            [Point(row, col) for row in range(-1, self.height + 1) for col in range(-1, self.width + 1)])

    def symbol_set(self):
        return SymbolSet(["INSIDE", "OUTSIDE"])

    def configure(self, sg):
        symbol_set = self.symbol_set()
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            if p.x == -1 or p.x == self.width or p.y == -1 or p.y == self.height:
                sg.solver.add(sg.cell_is(p, symbol_set.OUTSIDE))
            else:
                num = self.grid[p.y][p.x]
                if num.isnumeric():
                    sg.solver.add(
                        PbEq([(sg.grid[p] != val.symbol, 1) for val in sg.edge_sharing_neighbors(p)], int(num)))

        continuous_region(sg, rc, symbol_set.INSIDE)
        continuous_region(sg, rc, symbol_set.OUTSIDE)
