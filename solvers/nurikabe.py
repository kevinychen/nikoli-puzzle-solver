from solvers.utils import *


class NurikabeSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/nurikabe/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[self.grid[row][col] if self.grid[row][col].isnumeric()
                   else symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return f'pzprv3/nurikabe/{self.height}/{self.width}/{table(result)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return SymbolSet([("WHITE", "+"), ("BLACK", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            num = self.grid[p.y][p.x]
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
            for color, region_id in zip(
                    sg.lattice.edge_sharing_neighbors(sg.grid, p),
                    sg.lattice.edge_sharing_neighbors(rc.region_id_grid, p)):
                sg.solver.add(Implies(sg.grid[p] == color.symbol, rc.region_id_grid[p] == region_id.symbol))

        continuous_region(sg, rc, symbol_set.BLACK)
        no2x2(sg, symbol_set.BLACK)
