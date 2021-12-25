from collections import defaultdict
import grilops
from grilops.geometry import Point
from grilops.shapes import Vector
from re import match
from solvers.abstract_solver import AbstractSolver
from solvers.common_rules import distinct_rows_and_columns
from uuid import uuid4
from z3 import If, Int


class SkyscrapersSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/skyscrapers/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.size = int(matched.group(1))
        self.grid = list(map(lambda row: row.split(' ')[:-1], matched.group(3).split('/')))

    def to_pzprv3(self, solved_grid):
        result = [[str(solved_grid[Point(row - 1, col - 1)]) if 1 <= row <= self.size and 1 <= col <= self.size
                   else self.grid[row][col] for col in range(self.size + 2)] for row in range(self.size + 2)]
        return 'pzprv3/skyscrapers/{}/{}/{}/'.format(
            self.size,
            self.size,
            '/'.join(map(lambda row: ' '.join(row) + ' ', result)))

    def lattice(self):
        return grilops.get_square_lattice(self.size)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(1, self.size)

    def configure(self, sg):
        lines = []
        for i in range(self.size):
            lines.append((Point(i, -1), Vector(0, 1)))
            lines.append((Point(i, self.size), Vector(0, -1)))
            lines.append((Point(-1, i), Vector(1, 0)))
            lines.append((Point(self.size, i), Vector(-1, 0)))

        for p, v in lines:
            num = self.grid[p.y + 1][p.x + 1]
            if num.isnumeric():
                max_heights = defaultdict(lambda: Int(str(uuid4())))
                num_visible = defaultdict(lambda: Int(str(uuid4())))
                prev_max_height, prev_num_visible = 0, 0
                p = p.translate(v)
                while p in sg.grid:
                    sg.solver.add(max_heights[p] == If(sg.grid[p] > prev_max_height, sg.grid[p], prev_max_height))
                    sg.solver.add(num_visible[p] == If(
                        max_heights[p] > prev_max_height, prev_num_visible + 1, prev_num_visible))
                    prev_max_height, prev_num_visible = max_heights[p], num_visible[p]
                    p = p.translate(v)
                sg.solver.add(prev_num_visible == int(num))

        distinct_rows_and_columns(sg)
