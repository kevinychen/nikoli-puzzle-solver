from itertools import combinations
from solvers.utils import *

WHITE = '0'
BLACK = '1'
EMPTY_CIRCLE = '-2'


class BalanceLoopSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/balance/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        horizontals = [['1' if 'E' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                        for col in range(self.width - 1)] for row in range(self.height)]
        verticals = [['1' if 'S' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                      for col in range(self.width)] for row in range(self.height - 1)]
        return f'pzprv3/balance/{self.height}/{self.width}/{table(self.grid)}/{table(horizontals)}/{table(verticals)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        symbol_set = LoopSymbolSet(self.lattice())
        symbol_set.append('empty', ' ')
        return symbol_set

    def configure(self, sg):
        symbol_set = self.symbol_set()
        straight_lines = [symbol_set.NS, symbol_set.EW]
        lc = LoopConstrainer(sg, single_loop=True)

        for p in sg.lattice.points:
            clue = self.grid[p.y][p.x]
            if clue != '.':
                color, num = clue.split(',')
                choices = []
                for dir1, dir2 in combinations(sg.lattice.edge_sharing_directions(), 2):
                    line1, line2 = sight_line(sg, p, dir1), sight_line(sg, p, dir2)
                    for len1 in range(1, len(line1)):
                        for len2 in range(1, len(line2)):
                            if color == WHITE and len1 != len2:
                                continue
                            if color == BLACK and len1 == len2:
                                continue
                            if num != EMPTY_CIRCLE and len1 + len2 != int(num):
                                continue
                            choices.append(And(
                                sg.cell_is_one_of(
                                    p,
                                    [i for i, s in symbol_set.symbols.items() if s.name == dir1.name + dir2.name]),
                                *[sg.cell_is_one_of(q, straight_lines) for q in line1[1:len1]],
                                Not(sg.cell_is_one_of(line1[len1], straight_lines)),
                                *[sg.cell_is_one_of(q, straight_lines) for q in line2[1:len2]],
                                Not(sg.cell_is_one_of(line2[len2], straight_lines))))
                sg.solver.add(Or(choices))

        # Optimization: loop starts at one of the circles
        sg.solver.add(lc.loop_order_grid[next(p for p in sg.lattice.points if self.grid[p.y][p.x] != '.')] == 0)
