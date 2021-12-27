from solvers.utils import *

WHITE = '1'
BLACK = '2'


class KropkiSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/kropki/(\\d+)/(\\d+)/(.*)/(.*)', pzprv3)
        self.size = int(matched.group(1))
        self.verticals = parse_table(matched.group(3))[:self.size]
        self.horizontals = parse_table(matched.group(3))[self.size:2 * self.size - 1]

    def to_pzprv3(self, solved_grid):
        result = [[str(solved_grid[Point(row, col)]) for col in range(self.size)] for row in range(self.size)]
        return (
            'pzprv3/kropki/'
            f'{self.size}/{self.size}/{table(self.verticals)}/{table(self.horizontals)}/{table(result)}/')

    def lattice(self):
        return grilops.get_square_lattice(self.size)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(1, self.size)

    def configure(self, sg):
        for p in sg.lattice.points:
            for v, grid in [(Vector(0, 1), self.verticals), (Vector(1, 0), self.horizontals)]:
                q = p.translate(v)
                if q in sg.grid:
                    num = grid[p.y][p.x]
                    white_condition = Or(sg.grid[p] == sg.grid[q] + 1, sg.grid[p] + 1 == sg.grid[q])
                    black_condition = Or(sg.grid[p] == sg.grid[q] * 2, sg.grid[p] * 2 == sg.grid[q])
                    if num == WHITE:
                        sg.solver.add(white_condition)
                    elif num == BLACK:
                        sg.solver.add(black_condition)
                    else:
                        sg.solver.add(Not(Or(white_condition, black_condition)))

        distinct_rows_and_columns(sg)
