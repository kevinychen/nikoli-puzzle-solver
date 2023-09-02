from lib import *


class Arrows(AbstractSolver):
    def run(self, puzzle, solve):
        directions = puzzle.lattice_type.vertex_sharing_directions()

        sg = SymbolGrid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(-1, len(directions) - 1))

        arrow_spots = set(
            [q for p in puzzle.points for q in sg.lattice.edge_sharing_points(p) if q not in puzzle.points]
        )
        for p in sg.grid:
            sg.solver.add((sg.grid[p] >= 0) == (p in arrow_spots))

        # Each number represents the number of arrows pointing to it
        for p, number in puzzle.texts.items():
            num_pointing = []
            for v in sg.lattice.vertex_sharing_directions():
                q = sight_line(sg, p, v)[-1]
                if q in arrow_spots:
                    num_pointing.append(sg.grid[q] == directions.index(sg.lattice.opposite_direction(v)))
            sg.solver.add(Sum(num_pointing) == number)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != -1:
                solution.symbols[p] = Symbol.from_arrow("arrow_B_W", directions[solved_grid[p]])
