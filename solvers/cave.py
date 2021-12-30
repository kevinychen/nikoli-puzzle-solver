from solvers.utils import *


class CaveSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/cave/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return f'pzprv3/cave/{self.height}/{self.width}/{table(self.grid)}/{table(result)}/'

    def lattice(self):
        return RectangularLattice(
            [Point(row, col) for row in range(-1, self.height + 1) for col in range(-1, self.width + 1)])

    def symbol_set(self):
        return SymbolSet([("WHITE", "+"), ("BLACK", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            if p.x == -1 or p.x == self.width or p.y == -1 or p.y == self.height:
                sg.solver.add(sg.cell_is(p, symbol_set.BLACK))
            else:
                num = self.grid[p.y][p.x]
                if num.isnumeric():
                    all_is_visible = [sg.cell_is(p, symbol_set.WHITE)]
                    for direction in sg.lattice.edge_sharing_directions():
                        line = sight_line(sg, p, direction)
                        for i in range(1, len(line)):
                            all_is_visible.append(And([sg.cell_is(q, symbol_set.WHITE) for q in line[:i+1]]))
                    sg.solver.add(PbEq([(is_visible, 1) for is_visible in all_is_visible], int(num)))

        continuous_region(sg, rc, lambda q: sg.cell_is(q, symbol_set.WHITE))
        continuous_region(sg, rc, lambda q: sg.cell_is(q, symbol_set.BLACK))
