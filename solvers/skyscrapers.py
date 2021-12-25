import grilops
from re import match
from solvers.abstract_solver import AbstractSolver
from solvers.common_rules import *
from uuid import uuid4
from z3 import If, Int


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
        for p, v in border_sight_lines(self.size):
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
