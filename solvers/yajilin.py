from solvers.utils import *

DIRECTIONS = {'1': Vector(-1, 0), '2': Vector(1, 0), '3': Vector(0, -1), '4': Vector(0, 1)}


class YajilinSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/yajilin/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [['#' if symbol_set.symbols[solved_grid[Point(row, col)]].label == '#' else '.'
                   for col in range(self.width)] for row in range(self.height)]
        horizontals = [['1' if 'E' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                        for col in range(self.width - 1)] for row in range(self.height)]
        verticals = [['1' if 'S' in symbol_set.symbols[solved_grid[Point(row, col)]].name else '0'
                      for col in range(self.width)] for row in range(self.height - 1)]
        return (
            'pzprv3/yajilin/'
            f'{self.height}/{self.width}/{table(self.grid)}/{table(result)}/{table(horizontals)}/{table(verticals)}/')

    def lattice(self):
        return grilops.get_rectangle_lattice(self.height, self.width)

    def symbol_set(self):
        symbol_set = LoopSymbolSet(self.lattice())
        symbol_set.append('BLACK', '#')
        symbol_set.append('WALL', ' ')
        return symbol_set

    def configure(self, sg):
        symbol_set = self.symbol_set()
        LoopConstrainer(sg, single_loop=True)

        for p in sg.lattice.points:
            clue = self.grid[p.y][p.x]
            if clue == '.':
                sg.solver.add(Not(sg.cell_is(p, symbol_set.WALL)))
            else:
                direction, num = clue.split(',')
                sg.solver.add(sg.cell_is(p, symbol_set.WALL))
                sg.solver.add(PbEq(
                    [(sg.cell_is(q, symbol_set.BLACK), 1) for q in sight_line(sg, p, DIRECTIONS[direction])],
                    int(num)))

            no_adjacent_symbols(sg, symbol_set.BLACK)
