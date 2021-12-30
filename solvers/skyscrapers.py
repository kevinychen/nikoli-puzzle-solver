from solvers.utils import *


class SkyscrapersSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/skyscrapers/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.size = int(matched.group(1))
        self.grid = parse_table(matched.group(3))

    def to_pzprv3(self, solved_grid):
        result = [[str(solved_grid[Point(row - 1, col - 1)]) if 1 <= row <= self.size and 1 <= col <= self.size
                   else self.grid[row][col] for col in range(self.size + 2)] for row in range(self.size + 2)]
        return f'pzprv3/skyscrapers/{self.size}/{self.size}/{table(result)}/'

    def lattice(self):
        return grilops.get_square_lattice(self.size)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(1, self.size)

    def configure(self, sg):
        border_lines = []
        for i in range(self.size):
            border_lines.append((Point(i, -1), Vector(0, 1)))
            border_lines.append((Point(i, self.size), Vector(0, -1)))
            border_lines.append((Point(-1, i), Vector(1, 0)))
            border_lines.append((Point(self.size, i), Vector(-1, 0)))
        for p, v in border_lines:
            num = self.grid[p.y + 1][p.x + 1]
            if num.isnumeric():
                line = sight_line(sg, p.translate(v), v)
                sg.solver.add(PbEq(
                    [(And([sg.grid[q] > sg.grid[r] for r in line[:i]]), 1) for i, q in enumerate(line)], int(num)))

        distinct_rows_and_columns(sg)
