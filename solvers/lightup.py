from solvers.utils import *


def _is_wall(val):
    return val.isnumeric() or val == '-'


class LightUpSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/lightup/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[self.grid[row][col] if _is_wall(self.grid[row][col])
                   else symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return f'pzprv3/lightup/{self.height}/{self.width}/{table(result)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return SymbolSet([("EMPTY", "+"), ("LIGHT", "#")])

    def configure(self, sg):
        symbol_set = self.symbol_set()

        for p in sg.lattice.points:
            val = self.grid[p.y][p.x]
            if _is_wall(val):
                sg.solver.add(sg.cell_is(p, symbol_set.EMPTY))
                if val.isnumeric():
                    sg.solver.add(Sum([is_light.symbol for is_light in sg.edge_sharing_neighbors(p)]) == int(val))
            else:
                lines = []
                for n in sg.edge_sharing_neighbors(p):
                    lines.extend(sight_line(sg, n.location, n.direction, lambda q: not _is_wall(self.grid[q.y][q.x])))
                sg.solver.add(Implies(
                    sg.cell_is(p, symbol_set.LIGHT), And([sg.cell_is(q, symbol_set.EMPTY) for q in lines])))
                sg.solver.add(Implies(
                    sg.cell_is(p, symbol_set.EMPTY), Or([sg.cell_is(q, symbol_set.LIGHT) for q in lines])))
