from solvers.utils import *


class MeanderingNumbersSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/meander/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.verticals = parse_table(matched.group(3))[:self.height]
        self.horizontals = parse_table(matched.group(3))[self.height:2 * self.height - 1]
        self.grid = parse_table(matched.group(3))[2 * self.height - 1:3 * self.height - 1]

    def to_pzprv3(self, solved_grid):
        result = [[str(solved_grid[Point(row, col)]) for col in range(self.width)] for row in range(self.height)]
        return (
            'pzprv3/meander/'
            f'{self.height}/{self.width}/'
            f'{table(self.verticals)}/{table(self.horizontals)}/{table(self.grid)}/{table(result)}/')

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(0, self.height * self.width)

    def configure(self, sg):
        for region in convert_pzprv3_borders_to_regions(sg, self.verticals, self.horizontals):
            # Each region must have numbers from 1 to n in an orthogonally connected path
            sg.solver.add(Or([sg.cell_is(p, 1) for p in region]))
            for p in region:
                sg.solver.add(Or(
                    sg.cell_is(p, len(region)),
                    *[sg.grid[q] == sg.grid[p] + 1 for q in sg.lattice.edge_sharing_points(p) if q in region]))

                # Two of the same number may not be adjacent
                sg.solver.add(And([sg.grid[n.location] != sg.grid[p] for n in sg.vertex_sharing_neighbors(p)]))

                # Givens must be correct
                num = self.grid[p.y][p.x]
                if num.isnumeric():
                    sg.solver.add(sg.cell_is(p, int(num)))
