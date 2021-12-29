from solvers.utils import *


class SimpleLoopSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/simpleloop/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        horizontals = [['1' if 'E' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                        for col in range(self.width - 1)] for row in range(self.height)]
        verticals = [['1' if 'S' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                      for col in range(self.width)] for row in range(self.height - 1)]
        return f'pzprv3/simpleloop/{self.height}/{self.width}/{table(self.grid)}/{table(horizontals)}/{table(verticals)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        symbol_set = LoopSymbolSet(self.lattice())
        symbol_set.append('BLACK', '#')
        return symbol_set

    def configure(self, sg):
        lc = LoopConstrainer(sg, single_loop=True)
        for p in sg.lattice.points:
            sg.solver.add((lc.inside_outside_grid[p] == L) == (self.grid[p.y][p.x] == '.'))

        # Optimization: loop starts at one of the empty squares
        sg.solver.add(lc.loop_order_grid[next(p for p in sg.lattice.points if self.grid[p.y][p.x] == '.')] == 0)
