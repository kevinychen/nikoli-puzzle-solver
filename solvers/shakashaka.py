from lib import *


class Shakashaka(AbstractSolver):
    def run(self, puzzle, solve):
        # SW means a black triangle with an SW corner, i.e. a line going from NW to SE with the bottom left shaded.
        symbol_set = grilops.SymbolSet(["EMPTY", "NW", "SW", "SE", "NE", "WALL"])
        triangles = (symbol_set.NW, symbol_set.SW, symbol_set.SE, symbol_set.NE)
        dirs = (Directions.S, Directions.E, Directions.N, Directions.W)

        sg = SymbolGrid(puzzle.lattice(border=True), symbol_set)

        for p in sg.grid:
            sg.solver.add((p not in puzzle.points or p in puzzle.shaded) == (sg.grid[p] == symbol_set.WALL))

        # In every 2x2 box, if there are 3 empty squares, the 4th is either empty
        # or contains a triangle in the corresponding direction as its position in the box
        directions = [symbol_set.NW, symbol_set.NE, symbol_set.SW, symbol_set.SE]
        for junction in junctions(sg):
            for p, direction in zip(junction, directions):
                sg.solver.add(
                    Implies(
                        And([sg.grid[q] == symbol_set.EMPTY for q in junction if q != p]),
                        Or(sg.grid[p] == symbol_set.EMPTY, sg.grid[p] == direction),
                    )
                )

        # Each number represents the number of adjacent triangles
        for p, number in puzzle.texts.items():
            sg.solver.add(Sum([sg.cell_is_one_of(q, triangles) for q in sg.lattice.edge_sharing_points(p)]) == number)

        for p in puzzle.points - puzzle.shaded.keys():
            # An SW must have either a SE to its east, or a blank to its east and an SW to its southeast.
            # Similar logic applies for the other directions.
            choices = [sg.grid[p] == symbol_set.EMPTY]
            for i in range(4):
                choices.append(
                    And(
                        sg.grid[p] == triangles[i],
                        Or(
                            sg.grid[p.translate(dirs[i])] == triangles[(i + 1) % 4],
                            And(
                                sg.grid[p.translate(dirs[i])] == symbol_set.EMPTY,
                                sg.grid[p.translate(dirs[i]).translate(dirs[(i + 3) % 4])] == triangles[i],
                            ),
                        ),
                    )
                )
            sg.solver.add(Or(choices))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.symbols and solved_grid[p] > 0:
                solution.symbols[p] = Symbol(solved_grid[p], "tri")
