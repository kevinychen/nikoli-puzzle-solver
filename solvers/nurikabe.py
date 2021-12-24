import grilops
from grilops.geometry import Point
from grilops.regions import RegionConstrainer, R
from re import match
from solvers.abstract_solver import AbstractSolver
from solvers.common_rules import binary_symbol_set, continuous_region, no2x2
from z3 import Implies


class NurikabeSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/nurikabe/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = list(map(lambda row: row.split(' ')[:-1], matched.group(3).split('/')))

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[self.grid[row][col] if self.grid[row][col].isnumeric()
                   else symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return 'pzprv3/nurikabe/{}/{}/{}/'.format(
            self.height, self.width, '/'.join(map(lambda row: ' '.join(row) + ' ', result)))

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return binary_symbol_set()

    def configure(self, sg):
        symbol_set = self.symbol_set()
        rc = RegionConstrainer(sg.lattice, solver=sg.solver)

        for row, col in sg.lattice.points:
            p = Point(row, col)
            num = self.grid[row][col]
            if num.isnumeric():
                # All numbers correspond to a different region with the given size, rooted at the number
                sg.solver.add(sg.cell_is(p, symbol_set.WHITE))
                sg.solver.add(rc.region_id_grid[p] == sg.lattice.point_to_index(p))
                sg.solver.add(rc.region_size_grid[p] == int(num))
                sg.solver.add(rc.parent_grid[p] == R)
            else:
                # No islands without a number
                sg.solver.add(Implies(sg.cell_is(p, symbol_set.WHITE), rc.parent_grid[p] != R))

        # No two regions with the same color may be adjacent
        for p in sg.lattice.points:
            for color, region_id in \
                    zip(sg.lattice.edge_sharing_neighbors(sg.grid, p),
                        sg.lattice.edge_sharing_neighbors(rc.region_id_grid, p)):
                sg.solver.add(
                    Implies(
                        sg.cell_is(p, color.symbol),
                        rc.region_id_grid[p] == region_id.symbol))

        continuous_region(sg, rc, symbol_set.BLACK)
        no2x2(sg, symbol_set.BLACK)
