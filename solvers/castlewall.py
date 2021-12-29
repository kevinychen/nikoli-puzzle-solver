from solvers.utils import *

DIRECTIONS = {'1': Vector(-1, 0), '2': Vector(1, 0), '3': Vector(0, -1), '4': Vector(0, 1)}
WHITE = '1'
BLACK = '2'


class CastleWallSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/castle/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        horizontals = [['1' if 'E' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                        for col in range(self.width - 1)] for row in range(self.height)]
        verticals = [['1' if 'S' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                      for col in range(self.width)] for row in range(self.height - 1)]
        return f'pzprv3/castle/{self.height}/{self.width}/{table(self.grid)}/{table(horizontals)}/{table(verticals)}/'

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        symbol_set = LoopSymbolSet(self.lattice())
        symbol_set.append('empty', '#')
        return symbol_set

    def configure(self, sg):
        symbol_set = self.symbol_set()
        lc = LoopConstrainer(sg, single_loop=True)

        for p in sg.lattice.points:
            direction, num, color = self.grid[p.y][p.x].split(',')
            if num != '-1':
                if num.isnumeric():
                    v = DIRECTIONS[direction]
                    direction_name = next(
                        direction.name for direction in sg.lattice.edge_sharing_directions() if direction.vector == v)
                    allowed_loop_symbols = [s.index for s in symbol_set.symbols.values() if direction_name in s.name]
                    sg.solver.add(PbEq(
                        [(sg.cell_is_one_of(q, allowed_loop_symbols), 1) for q in sight_line(sg, p, v)], int(num)))

                if color == WHITE:
                    sg.solver.add(lc.inside_outside_grid[p] == I)
                elif color == BLACK:
                    sg.solver.add(lc.inside_outside_grid[p] == O)
                else:
                    sg.solver.add(lc.inside_outside_grid[p] != L)
