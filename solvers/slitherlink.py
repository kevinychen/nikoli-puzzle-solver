from grilops.geometry import Point, RectangularLattice
from grilops.regions import RegionConstrainer, R
from re import match
from solvers.abstract_solver import AbstractSolver
from solvers.common_rules import binary_symbol_set, continuous_region
from z3 import PbEq


class SlitherlinkSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3\\.1/slither/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = list(map(lambda row: row.split(' ')[:-1], matched.group(3).split('/')[:self.height]))

    def to_pzprv3(self, solved_grid):
        zeroes = [['0' for _col in range(self.width)] for _row in range(self.height)]
        verticals = [['0' if solved_grid[Point(row, col - 1)] == solved_grid[Point(row, col)] else '1'
                      for col in range(self.width + 1)] for row in range(self.height)]
        horizontals = [['0' if solved_grid[Point(row - 1, col)] == solved_grid[Point(row, col)] else '1'
                      for col in range(self.width)] for row in range(self.height + 1)]
        return 'pzprv3.1/slither/{}/{}/{}/{}/{}/{}/'.format(
            self.height,
            self.width,
            '/'.join(map(lambda row: ' '.join(row) + ' ', self.grid)),
            '/'.join(map(lambda row: ' '.join(row) + ' ', zeroes)),
            '/'.join(map(lambda row: ' '.join(row) + ' ', verticals)),
            '/'.join(map(lambda row: ' '.join(row) + ' ', horizontals)))

    def lattice(self):
        return RectangularLattice(
            [Point(row, col) for row in range(-1, self.height + 1) for col in range(-1, self.width + 1)])

    def symbol_set(self):
        return binary_symbol_set("INSIDE", "OUTSIDE")

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
