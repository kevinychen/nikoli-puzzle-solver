import grilops
from re import match
from solvers.abstract_solver import AbstractSolver
from solvers.common_rules import *
from uuid import uuid4
from z3 import If, Int, PbEq


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
        return SymbolSet(['-'] + [str(i) for i in range(1, self.size + 1)])

    def configure(self, sg):
        for p, v in border_sight_lines(self.size):
            num = self.grid[p.y + 1][p.x + 1]
            if num.isnumeric():
                first_visible = defaultdict(lambda: Int(str(uuid4())))
                prev_first_visible = int(num)
                p = p.translate(v)
                while p in sg.grid:
                    sg.solver.add(prev_first_visible == If(sg.grid[p] == 0, first_visible[p], sg.grid[p]))
                    prev_first_visible = first_visible[p]
                    p = p.translate(v)

        # Each letter appears in each row and in each column exactly once
        for i in range(1, self.num_letters + 1):
            for row in range(self.size):
                sg.solver.add(PbEq([(sg.grid[Point(row, col)] == i, 1) for col in range(self.size)], 1))
            for col in range(self.size):
                sg.solver.add(PbEq([(sg.grid[Point(row, col)] == i, 1) for row in range(self.size)], 1))
