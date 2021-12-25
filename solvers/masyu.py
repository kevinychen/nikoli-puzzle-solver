import grilops
from grilops.loops import LoopConstrainer, LoopSymbolSet
from re import match
from solvers.abstract_solver import AbstractSolver
from solvers.common_rules import *
from z3 import And, Implies, Or

WHITE = '1'
BLACK = '2'


class MasyuSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/mashu/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        horizontals = [['1' if 'E' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                        for col in range(self.width - 1)] for row in range(self.height)]
        verticals = [['1' if 'S' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                      for col in range(self.width)] for row in range(self.height - 1)]
        return f'pzprv3/mashu/{self.height}/{self.width}/{table(self.grid)}/{table(horizontals)}/{table(verticals)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        symbol_set = LoopSymbolSet(self.lattice())
        symbol_set.append('empty', ' ')
        return symbol_set

    def configure(self, sg):
        symbol_set = self.symbol_set()
        lc = LoopConstrainer(sg, single_loop=True)

        for p in sg.lattice.points:
            circle = self.grid[p.y][p.x]
            if circle == WHITE:
                choices = []
                if 0 < p.x < self.width - 1:
                    choices.append(And(sg.cell_is(p, symbol_set.EW), Or(
                        sg.cell_is_one_of(Point(p.y, p.x - 1), [symbol_set.NE, symbol_set.SE]),
                        sg.cell_is_one_of(Point(p.y, p.x + 1), [symbol_set.NW, symbol_set.SW]))))
                if 0 < p.y < self.height - 1:
                    choices.append(And(sg.cell_is(p, symbol_set.NS), Or(
                        sg.cell_is_one_of(Point(p.y - 1, p.x), [symbol_set.SW, symbol_set.SE]),
                        sg.cell_is_one_of(Point(p.y + 1, p.x), [symbol_set.NW, symbol_set.NE]))))
                sg.solver.add(Or(*choices))
            elif circle == BLACK:
                sg.solver.add(sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.NE, symbol_set.SW, symbol_set.SE]))
                if p.x > 0:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.SW]),
                        sg.cell_is(Point(p.y, p.x - 1), symbol_set.EW)))
                if p.x < self.width - 1:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NE, symbol_set.SE]),
                        sg.cell_is(Point(p.y, p.x + 1), symbol_set.EW)))
                if p.y > 0:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.NE]),
                        sg.cell_is(Point(p.y - 1, p.x), symbol_set.NS)))
                if p.y < self.height - 1:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.SW, symbol_set.SE]),
                        sg.cell_is(Point(p.y + 1, p.x), symbol_set.NS)))

        # Optimization: loop starts at one of the circles
        sg.solver.add(lc.loop_order_grid[next(p for p in sg.lattice.points if self.grid[p.y][p.x] != '.')] == 0)
