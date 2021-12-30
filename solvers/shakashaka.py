from solvers.utils import *

BLANK_WALL = '5'
DIRS = [Vector(0, 1), Vector(-1, 0), Vector(0, -1), Vector(1, 0)]


class ShakashakaSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/shakashaka/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]

    def to_pzprv3(self, solved_grid):
        symbol_set = self.symbol_set()
        result = [[symbol_set.symbols[solved_grid[Point(row, col)]].label
                   for col in range(self.width)] for row in range(self.height)]
        return  f'pzprv3/shakashaka/{self.height}/{self.width}/{table(self.grid)}/{table(result)}/'

    def lattice(self):
        return RectangularLattice(
            [Point(row, col) for row in range(-1, self.height + 1) for col in range(-1, self.width + 1)])

    def symbol_set(self):
        return SymbolSet([("WALL", "."), ("EMPTY", "+"), ("SW", "2"), ("SE", "3"), ("NE", "4"), ("NW", "5")])

    def configure(self, sg):
        symbol_set = self.symbol_set()

        # In every 2x2 box, there cannot be only 3 empty squares.
        for row in range(self.height - 1):
            for col in range(self.width - 1):
                box = [Point(y, x) for y in range(row, row + 2) for x in range(col, col + 2)]
                for p in box:
                    sg.solver.add(Implies(
                        And([sg.cell_is(q, symbol_set.EMPTY) for q in box if q != p]),
                        sg.cell_is(p, symbol_set.EMPTY)))

        # SW means a black triangle with a SW corner, i.e. a line going from NW to SE with the bottom left shaded.
        diagonal_symbols = [symbol_set.SW, symbol_set.SE, symbol_set.NE, symbol_set.NW]
        for p in sg.lattice.points:
            if p.x == -1 or p.x == self.width or p.y == -1 or p.y == self.height:
                sg.solver.add(sg.cell_is(p, symbol_set.WALL))
            else:
                num = self.grid[p.y][p.x]
                if num.isnumeric():
                    sg.solver.add(sg.cell_is(p, symbol_set.WALL))
                    if num != BLANK_WALL:
                        sg.solver.add(PbEq([(sg.cell_is_one_of(q, diagonal_symbols), 1)
                                            for q in sg.lattice.edge_sharing_points(p)], int(num)))
                else:
                    sg.solver.add(Not(sg.cell_is(p, symbol_set.WALL)))

                    # A SW must have either a SE to its east, or a blank to its east and a SW to its southeast.
                    # Also, it must either have an empty or NE to its northeast.
                    # Similar logic applies for the other directions.
                    choices = [sg.cell_is(p, symbol_set.EMPTY)]
                    for i in range(4):
                        choices.append(And(
                            sg.cell_is(p, diagonal_symbols[i]),
                            Or(
                                sg.cell_is(p.translate(DIRS[i]), diagonal_symbols[(i + 1) % 4]),
                                And(
                                    sg.cell_is(p.translate(DIRS[i]), symbol_set.EMPTY),
                                    sg.cell_is(p.translate(DIRS[i]).translate(DIRS[(i + 3) % 4]), diagonal_symbols[i]))
                            ),
                            sg.cell_is_one_of(
                                p.translate(DIRS[i]).translate(DIRS[(i + 1) % 4]),
                                [symbol_set.EMPTY, diagonal_symbols[(i + 2) % 4]])))
                    sg.solver.add(Or(choices))
