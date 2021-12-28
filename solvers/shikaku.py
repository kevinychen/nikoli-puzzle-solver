from solvers.utils import *


class ShikakuSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/shikaku/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        verticals = [['0' if solved_grid[Point(row, col)] == solved_grid[Point(row, col + 1)] else '1'
                      for col in range(self.width - 1)] for row in range(self.height)]
        horizontals = [['0' if solved_grid[Point(row, col)] == solved_grid[Point(row + 1, col)] else '1'
                        for col in range(self.width)] for row in range(self.height - 1)]
        return f'pzprv3/shikaku/{self.height}/{self.width}/{table(self.grid)}/{table(verticals)}/{table(horizontals)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(0, self.height * self.width)

    def configure(self, sg):
        rc = RegionConstrainer(sg.lattice, sg.solver, rectangular=True)

        for p in sg.lattice.points:
            num = self.grid[p.y][p.x]
            if num.isnumeric():
                sg.solver.add(rc.parent_grid[p] == R)
                sg.solver.add(rc.region_size_grid[p] == int(num))
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])
