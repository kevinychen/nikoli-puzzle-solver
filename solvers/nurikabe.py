import grilops
from grilops.geometry import Point
from grilops.regions import RegionConstrainer, R
from re import match
from solvers.abstract_solver import AbstractSolver
from z3 import Implies, Int, Or


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
        return grilops.SymbolSet([
            ("BLACK", "#"),
            ("WHITE", "+"),
        ])

    def configure(self, sg):
        symbol_set = self.symbol_set()
        rc = grilops.regions.RegionConstrainer(sg.lattice, solver=sg.solver)

        sea_root = Int('sea')
        for row, col in sg.lattice.points:
            p = Point(row, col)
            num = self.grid[row][col]
            if num.isnumeric():
                sg.solver.add(sg.cell_is(p, symbol_set.WHITE))
                sg.solver.add(rc.region_id_grid[p] == sg.lattice.point_to_index(p))
                sg.solver.add(rc.region_size_grid[p] == int(num))
                sg.solver.add(rc.parent_grid[p] == R)
            else:
                sg.solver.add(Implies(sg.cell_is(p, symbol_set.BLACK), rc.region_id_grid[p] == sea_root))
                sg.solver.add(Implies(sg.cell_is(p, symbol_set.WHITE), rc.region_id_grid[p] != sea_root))
                sg.solver.add(Implies(sg.cell_is(p, symbol_set.WHITE), rc.parent_grid[p] != R))

        # No two regions with the same color may be adjacent
        for p in sg.lattice.points:
            for color, region_id in \
                    zip(sg.lattice.edge_sharing_neighbors(sg.grid, p),
                        sg.lattice.edge_sharing_neighbors(rc.region_id_grid, p)):
                sg.solver.add(
                    Implies(
                        sg.grid[p] == color.symbol,
                        rc.region_id_grid[p] == region_id.symbol))

        # No 2x2 square of black cells
        for startRow in range(self.height - 1):
            for startCol in range(self.width - 1):
                sg.solver.add(Or(*[sg.grid[Point(row, col)] == symbol_set.WHITE
                                   for row in range(startRow, startRow + 2)
                                   for col in range(startCol, startCol + 2)]))
