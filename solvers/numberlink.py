from solvers.utils import *


class NumberlinkSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/numlin/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]
        self.num_links = len(set(num for row in self.grid for num in row if num.isnumeric()))

    def to_pzprv3(self, solved_grid):
        horizontals = [['1' if (solved_grid[Point(row, col)] == solved_grid[Point(row, col + 1)]
                                and solved_grid[Point(row, col)] != 0) else '0'
                        for col in range(self.width - 1)] for row in range(self.height)]
        verticals = [['1' if (solved_grid[Point(row, col)] == solved_grid[Point(row + 1, col)]
                              and solved_grid[Point(row, col)] != 0) else '0'
                      for col in range(self.width)] for row in range(self.height - 1)]
        return f'pzprv3/numlin/{self.height}/{self.width}/{table(self.grid)}/{table(horizontals)}/{table(verticals)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(0, self.num_links)

    def configure(self, sg):
        for p in sg.lattice.points:
            num = self.grid[p.y][p.x]
            if num.isnumeric():
                # A number endpoint must be orthogonally connected to one other square on the chain
                sg.solver.add(sg.cell_is(p, int(num)))
                sg.solver.add(PbEq([(n.symbol == sg.grid[p], 1) for n in sg.edge_sharing_neighbors(p)], 1))
            else:
                # Every other square on the chain must be orthogonally connected to two others
                sg.solver.add(Or(
                    sg.cell_is(p, 0),
                    PbEq([(n.symbol == sg.grid[p], 1) for n in sg.edge_sharing_neighbors(p)], 2)))
