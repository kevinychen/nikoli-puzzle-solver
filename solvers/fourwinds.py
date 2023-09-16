from lib import *


class FourWinds(AbstractSolver):
    def run(self, puzzle, solve):
        directions = puzzle.lattice_type.edge_sharing_directions()

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(-1, len(directions) - 1))

        # If an arm is pointing east, then increment the length of the region on the east, or start at 1
        lengths = {p: var() for p in sg.grid}
        for p in sg.grid:
            sg.solver.add((sg.grid[p] == -1) == (p in puzzle.texts))

            for i, v in enumerate(directions):
                prev = p.translate(v)
                sg.solver.add(
                    Implies(sg.grid[p] == i, lengths[p] - 1 == If(sg.grid.get(prev) == i, lengths.get(prev, 0), 0))
                )

        # Each number represents the sum of the lengths of the 4 arms
        for p, number in puzzle.texts.items():
            sg.solver.add(
                Sum(
                    [
                        If(n.symbol == directions.index(n.direction), lengths[n.location], 0)
                        for n in sg.edge_sharing_neighbors(p)
                    ]
                )
                == number
            )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != -1:
                solution.lines[p, p.translate(sg.lattice.opposite_direction(directions[solved_grid[p]]))] = True
