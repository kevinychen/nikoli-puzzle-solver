from solvers.utils import *


class TentaishoSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/tentaisho/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = matched.group(3).split('/')[:2 * self.height - 1]

    def to_pzprv3(self, solved_grid):
        verticals = [['0' if solved_grid[Point(row, col)] == solved_grid[Point(row, col + 1)] else '1'
                      for col in range(self.width - 1)] for row in range(self.height)]
        horizontals = [['0' if solved_grid[Point(row, col)] == solved_grid[Point(row + 1, col)] else '1'
                        for col in range(self.width)] for row in range(self.height - 1)]
        zeroes = [['0' for _ in range(self.width)] for _ in range(self.height)]
        return (
            'pzprv3/tentaisho/'
            f'{self.height}/{self.width}/'
            f'{"/".join(self.grid)}/{table(verticals)}/{table(horizontals)}/{table(zeroes)}/')

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(0, self.height * self.width)

    def configure(self, sg):
        rc = RegionConstrainer(sg.lattice, sg.solver)

        centers = [(i, j, int(num)) for i, row in enumerate(self.grid) for j, num in enumerate(row) if num.isnumeric()]

        for p in sg.lattice.points:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

            # Each square must be part of some galaxy, and the opposite square must be in the same galaxy
            choices = []
            for i, j, num in centers:
                opposite = Point(i - p.y, j - p.x)
                if opposite in sg.lattice.points:
                    choices.append(And(
                        sg.cell_is(p, sg.lattice.point_to_index(Point(i // 2, j // 2))),
                        sg.grid[p] == sg.grid[opposite]))
            sg.solver.add(Or(choices))

        # All galaxies have at least one square, rooted at the center (or closest square to the center)
        for i, j, _ in centers:
            sg.solver.add(rc.parent_grid[Point(i // 2, j // 2)] == R)
