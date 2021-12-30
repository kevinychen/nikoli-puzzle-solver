from solvers.utils import *


class EasyAsAbcSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/easyasabc/(\\d+)/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.size = int(matched.group(1))
        self.num_letters = int(matched.group(3))
        self.grid = parse_table(matched.group(4))

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row - 1, col - 1)]].label
                   if 1 <= row <= self.size and 1 <= col <= self.size
                   else self.grid[row][col] for col in range(self.size + 2)] for row in range(self.size + 2)]
        return f'pzprv3/easyasabc/{self.size}/{self.size}/{self.num_letters}/{table(result)}/'

    def lattice(self):
        return grilops.get_square_lattice(self.size)

    def symbol_set(self):
        return SymbolSet(['-'] + [str(i) for i in range(1, self.num_letters + 1)])

    def configure(self, sg):
        border_lines = []
        for i in range(self.size):
            border_lines.append((Point(i, -1), Vector(0, 1)))
            border_lines.append((Point(i, self.size), Vector(0, -1)))
            border_lines.append((Point(-1, i), Vector(1, 0)))
            border_lines.append((Point(self.size, i), Vector(-1, 0)))

        # Each border letter is the first one visible on that line
        for p, v in border_lines:
            num = self.grid[p.y + 1][p.x + 1]
            if num.isnumeric():
                line = sight_line(sg, p.translate(v), v)
                sg.solver.add(Or([And(
                    sg.grid[q] == int(num), *[sg.grid[r] == 0 for r in line[:i]]) for i, q in enumerate(line)]))

        # Each letter appears in each row and in each column exactly once
        for i in range(1, self.num_letters + 1):
            for row in range(self.size):
                sg.solver.add(PbEq([(sg.grid[Point(row, col)] == i, 1) for col in range(self.size)], 1))
            for col in range(self.size):
                sg.solver.add(PbEq([(sg.grid[Point(row, col)] == i, 1) for row in range(self.size)], 1))
