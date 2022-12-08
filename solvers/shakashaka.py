from solvers.utils import *


class Shakashaka(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        # SW means a black triangle with a SW corner, i.e. a line going from NW to SE with the bottom left shaded.
        symbol_set = SymbolSet(['EMPTY', 'NW', 'SW', 'SE', 'NE', 'WALL'])
        diagonal_symbols = [symbol_set.NW, symbol_set.SW, symbol_set.SE, symbol_set.NE]
        dirs = [Vector(1, 0), Vector(0, 1), Vector(-1, 0), Vector(0, -1)]

        sg = init_symbol_grid(
            RectangularLattice(
                [Point(row, col) for row in range(-1, puzzle.height + 1) for col in range(-1, puzzle.width + 1)]),
            symbol_set)

        # In every 2x2 box, if there are 3 empty squares, the 4th is either empty
        # or contains a triangle in the corresponding direction as its position in the box
        for row in range(puzzle.height - 1):
            for col in range(puzzle.width - 1):
                box = [Point(y, x) for y in range(row, row + 2) for x in range(col, col + 2)]
                for (i, p) in enumerate(box):
                    corresponding_direction = [symbol_set.NW, symbol_set.NE, symbol_set.SW, symbol_set.SE][i]
                    sg.solver.add(Implies(
                        And([sg.cell_is(q, symbol_set.EMPTY) for q in box if q != p]),
                        Or(sg.cell_is(p, symbol_set.EMPTY), sg.cell_is(p, corresponding_direction))))

        for p in sg.grid:
            if not (0 <= p.x < puzzle.width and 0 <= p.y < puzzle.height):
                sg.solver.add(sg.cell_is(p, symbol_set.WALL))
            elif p in puzzle.shaded:
                sg.solver.add(sg.cell_is(p, symbol_set.WALL))
                if p in puzzle.texts:
                    sg.solver.add(PbEq([(sg.cell_is_one_of(q, diagonal_symbols), 1)
                                        for q in sg.lattice.edge_sharing_points(p)], int(puzzle.texts[p])))
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
                            sg.cell_is(p.translate(dirs[i]), diagonal_symbols[(i + 1) % 4]),
                            And(
                                sg.cell_is(p.translate(dirs[i]), symbol_set.EMPTY),
                                sg.cell_is(p.translate(dirs[i]).translate(dirs[(i + 3) % 4]), diagonal_symbols[i]))
                        ),
                        sg.cell_is_one_of(
                            p.translate(dirs[i]).translate(dirs[(i + 1) % 4]),
                            [symbol_set.EMPTY, diagonal_symbols[(i + 2) % 4]])))
                sg.solver.add(Or(choices))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.symbols and solved_grid[p] > 0:
                solution.symbols[p] = Symbol(solved_grid[p], 'tri')
