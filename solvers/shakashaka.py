from lib import *


class Shakashaka(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        # SW means a black triangle with an SW corner, i.e. a line going from NW to SE with the bottom left shaded.
        symbol_set = grilops.SymbolSet(['EMPTY', 'NW', 'SW', 'SE', 'NE', 'WALL'])
        diagonal_symbols = (symbol_set.NW, symbol_set.SW, symbol_set.SE, symbol_set.NE)
        dirs = (Directions.S, Directions.E, Directions.N, Directions.W)

        sg = init_symbol_grid(puzzle.lattice(border=True), symbol_set)

        # In every 2x2 box, if there are 3 empty squares, the 4th is either empty
        # or contains a triangle in the corresponding direction as its position in the box
        for row in range(puzzle.height - 1):
            for col in range(puzzle.width - 1):
                box = [Point(y, x) for y in range(row, row + 2) for x in range(col, col + 2)]
                for (i, p) in enumerate(box):
                    corresponding_direction = [symbol_set.NW, symbol_set.NE, symbol_set.SW, symbol_set.SE][i]
                    sg.solver.add(Implies(
                        And([sg.grid[q] == symbol_set.EMPTY for q in box if q != p]),
                        Or(sg.grid[p] == symbol_set.EMPTY, sg.grid[p] == corresponding_direction)))

        for p in sg.grid:
            if p not in puzzle.points:
                sg.solver.add(sg.grid[p] == symbol_set.WALL)
            elif p in puzzle.shaded:
                sg.solver.add(sg.grid[p] == symbol_set.WALL)
                if p in puzzle.texts:
                    sg.solver.add(
                        Sum([sg.cell_is_one_of(q, diagonal_symbols) for q in sg.lattice.edge_sharing_points(p)])
                        == puzzle.texts[p])
            else:
                sg.solver.add(sg.grid[p] != symbol_set.WALL)

                # An SW must have either a SE to its east, or a blank to its east and an SW to its southeast.
                # Also, it must either have an empty or NE to its northeast.
                # Similar logic applies for the other directions.
                choices = [sg.grid[p] == symbol_set.EMPTY]
                for i in range(4):
                    choices.append(And(
                        sg.grid[p] == diagonal_symbols[i],
                        Or(
                            sg.grid[p.translate(dirs[i])] == diagonal_symbols[(i + 1) % 4],
                            And(
                                sg.grid[p.translate(dirs[i])] == symbol_set.EMPTY,
                                sg.grid[p.translate(dirs[i]).translate(dirs[(i + 3) % 4])] == diagonal_symbols[i])
                        ),
                        sg.cell_is_one_of(
                            p.translate(dirs[i]).translate(dirs[(i + 1) % 4]),
                            [symbol_set.EMPTY, diagonal_symbols[(i + 2) % 4]])))
                sg.solver.add(Or(choices))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.symbols and solved_grid[p] > 0:
                solution.symbols[p] = Symbol(solved_grid[p], 'tri')
