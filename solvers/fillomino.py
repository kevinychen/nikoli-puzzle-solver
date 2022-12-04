from solvers.utils import *


class Fillomino(AbstractSolver):

    def configure(self):
        sg = self.get_symbol_grid(
            grilops.get_rectangle_lattice(self.height, self.width),
            grilops.make_number_range_symbol_set(1, self.height * self.width))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            if p in self.texts:
                sg.solver.add(sg.cell_is(p, int(self.texts[p])))
            sg.solver.add(sg.grid[p] == rc.region_size_grid[p])
            for region_size, region_id in zip(
                    sg.lattice.edge_sharing_neighbors(rc.region_size_grid, p),
                    sg.lattice.edge_sharing_neighbors(rc.region_id_grid, p)):
                sg.solver.add(Implies(
                    rc.region_size_grid[p] == region_size.symbol, rc.region_id_grid[p] == region_id.symbol))

    def to_standard_format(self, sg, solved_grid):
        for row in range(self.height):
            for col in range(self.width - 1):
                if solved_grid[Point(row, col)] != solved_grid[Point(row, col + 1)]:
                    self.solved_vertical_borders.add(Point(row, col))
        for row in range(self.height - 1):
            for col in range(self.width):
                if solved_grid[Point(row, col)] != solved_grid[Point(row + 1, col)]:
                    self.solved_horizontal_borders.add(Point(row, col))
