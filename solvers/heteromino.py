from solvers.utils import *

SHAPES = [
    Shape([Vector(0, 0), Vector(0, 1), Vector(0, 2)]),
    Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0)]),
    Shape([Vector(0, 0), Vector(0, 1), Vector(1, 0)]),
    Shape([Vector(0, 0), Vector(0, 1), Vector(1, 1)]),
    Shape([Vector(0, 0), Vector(1, 0), Vector(1, 1)]),
    Shape([Vector(0, 1), Vector(1, 0), Vector(1, 1)]),
]


class HeterominoSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/heteromino/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        verticals = [['0' if solved_grid[Point(row, col)] == solved_grid[Point(row, col + 1)] else '1'
                      for col in range(-1, self.width)] for row in range(self.height)]
        horizontals = [['0' if solved_grid[Point(row, col)] == solved_grid[Point(row + 1, col)] else '1'
                        for col in range(self.width)] for row in range(-1, self.height)]
        return (
            'pzprv3/heteromino/'
            f'{self.height}/{self.width}/{table(self.grid)}/{table(verticals)}/{table(horizontals)}/')

    def lattice(self):
        return RectangularLattice(
            [Point(row, col) for row in range(-1, self.height + 1) for col in range(-1, self.width + 1)])

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(-1, len(SHAPES) - 1)

    def configure(self, sg):
        sc = ShapeConstrainer(sg.lattice, SHAPES, sg.solver, allow_copies=True)

        for p in sg.lattice.points:
            sg.solver.add(sg.grid[p] == sc.shape_type_grid[p])
            if p.x == -1 or p.x == self.width or p.y == -1 or p.y == self.height or self.grid[p.y][p.x] == '*':
                sg.solver.add(sg.cell_is(p, -1))
            else:
                sg.solver.add(sg.grid[p] != -1)

                # No two adjacent regions may be the same shape
                for shape_type, shape_instance in zip(
                        sg.lattice.edge_sharing_neighbors(sc.shape_type_grid, p),
                        sg.lattice.edge_sharing_neighbors(sc.shape_instance_grid, p)):
                    sg.solver.add(Implies(
                        sc.shape_type_grid[p] == shape_type.symbol, sc.shape_instance_grid[p] == shape_instance.symbol))
