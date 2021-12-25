import grilops
from grilops.geometry import Point
from grilops.regions import RegionConstrainer, R
from grilops.shapes import Shape, ShapeConstrainer, Vector
from re import match
from solvers.abstract_solver import AbstractSolver
from solvers.common_rules import binary_symbol_set, continuous_region, no2x2
from z3 import And, Implies, Int, Or


class LITSSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/lits/(\\d+)/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.num_regions = int(matched.group(3))
        self.grid = list(map(lambda row: row.split(' ')[:-1], matched.group(4).split('/')[:self.height]))

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return 'pzprv3/lits/{}/{}/{}/{}/{}/'.format(
            self.height,
            self.width,
            self.num_regions,
            '/'.join(map(lambda row: ' '.join(row) + ' ', self.grid)),
            '/'.join(map(lambda row: ' '.join(row) + ' ', result)))

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return binary_symbol_set("EMPTY", "PIECE")

    def configure(self, sg):
        symbol_set = self.symbol_set()
        shapes = [
            Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0), Vector(2, 1)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0), Vector(3, 0)]),
            Shape([Vector(0, 0), Vector(0, 1), Vector(0, 2), Vector(1, 1)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(1, 1), Vector(2, 1)]),
        ]
        rc = RegionConstrainer(sg.lattice, sg.solver)
        sc = ShapeConstrainer(
            sg.lattice, shapes, sg.solver, allow_rotations=True, allow_reflections=True, allow_copies=True)

        # Each region has one piece
        for i in range(self.num_regions):
            region = [Point(row, col) for row, col in sg.lattice.points if self.grid[row][col] == str(i)]
            region_root = Int(f'region{i}')
            for p in region:
                sg.solver.add(Implies(sg.cell_is(p, symbol_set.PIECE), sc.shape_instance_grid[p] == region_root))
                sg.solver.add(Implies(sg.cell_is(p, symbol_set.EMPTY), sc.shape_type_grid[p] == -1))
            sg.solver.add(Or([region_root == sg.lattice.point_to_index(p) for p in region]))
            sg.solver.add(Or([sg.cell_is(p, symbol_set.PIECE) for p in region]))

        # No two pieces with the same shape may be adjacent
        for p in sg.lattice.points:
            for color, shape_instance, shape_type in \
                    zip(sg.lattice.edge_sharing_neighbors(sg.grid, p),
                        sg.lattice.edge_sharing_neighbors(sc.shape_instance_grid, p),
                        sg.lattice.edge_sharing_neighbors(sc.shape_type_grid, p)):
                sg.solver.add(
                    Implies(
                        And(sg.cell_is(p, symbol_set.PIECE), sc.shape_type_grid[p] == shape_type.symbol),
                        sc.shape_instance_grid[p] == shape_instance.symbol))

        continuous_region(sg, rc, symbol_set.PIECE)
        no2x2(sg, symbol_set.PIECE)
