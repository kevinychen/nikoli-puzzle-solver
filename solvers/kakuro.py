import grilops
from re import match
from solvers.abstract_solver import AbstractSolver
from solvers.common_rules import *
from z3 import Sum


class KakuroSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/kakuro/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height + 1]

    def to_pzprv3(self, solved_grid):
        result = [[str(solved_grid[Point(row, col)]) for col in range(self.width)] for row in range(self.height)]
        return f'pzprv3/kakuro/{self.height}/{self.width}/{table(self.grid)}/{table(result)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(1, 9)

    def configure(self, sg):
        line_totals = []
        for row in range(self.height + 1):
            for col in range(self.width + 1):
                num = self.grid[row][col]
                if num != '.':
                    parts = num.split(',')
                    if row > 0 and parts[0] != '-1':
                        line_totals.append((int(parts[0]), sight_line(
                            Point(row - 1, col),
                            Vector(0, 1),
                            lambda p: p in sg.grid and self.grid[p.y + 1][p.x + 1] == '.')))
                    if col > 0 and parts[-1] != '-1':
                        line_totals.append((int(parts[-1]), sight_line(
                            Point(row, col - 1),
                            Vector(1, 0),
                            lambda p: p in sg.grid and self.grid[p.y + 1][p.x + 1] == '.')))
        for total, line in line_totals:
            sg.solver.add(Sum([sg.grid[p] for p in line]) == total)
            sg.solver.add(Distinct([sg.grid[p] for p in line]))
