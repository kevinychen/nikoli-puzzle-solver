from solvers.utils import *


class HitoriSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/hitori/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.size = int(matched.group(1))
        self.grid = parse_table(matched.group(3))[:self.size]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.size)] for row in range(self.size)]
        return f'pzprv3/hitori/{self.size}/{self.size}/{table(self.grid)}/{table(result)}/'

    def lattice(self):
        return grilops.get_square_lattice(self.size)

    def symbol_set(self):
        return SymbolSet(['#'] + [str(i) for i in range(1, self.size + 1)])

    def configure(self, sg):
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            sg.solver.add(sg.cell_is_one_of(p, [0, int(self.grid[p.y][p.x])]))

        # Each number appears in each row and in each column at most once
        for i in range(1, self.size + 1):
            for row in range(self.size):
                sg.solver.add(PbLe([(sg.grid[Point(row, col)] == i, 1) for col in range(self.size)], 1))
            for col in range(self.size):
                sg.solver.add(PbLe([(sg.grid[Point(row, col)] == i, 1) for row in range(self.size)], 1))

        continuous_region(sg, rc, lambda q: sg.grid[q] != 0)
        no_adjacent_symbols(sg, 0)


s = 'pzprv3/hitori/8/8/4 8 1 6 3 2 5 7 /3 6 7 2 1 6 5 4 /2 3 4 8 2 8 6 1 /4 1 6 5 7 7 3 5 /7 2 3 1 8 5 1 2 /3 5 6 7 3 1 8 4 /6 4 2 3 5 4 7 8 /8 7 1 4 2 3 5 6 /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /'
print(HitoriSolver(s).solve())