from lib import *


class Mochikoro(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # The number represents the size of the region
        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == 0)
            require_region_area(sg, p, lambda r: sg.grid[r] == 0, number)

        # Regions must be rectangular
        for junction in junctions(sg):
            sg.solver.add(Sum([sg.grid[p] == 1 for p in junction]) != 1)

        require_continuous(
            sg, lambda q: sg.grid[q] == 0, lambda q: [n.location for n in sg.vertex_sharing_neighbors(q)]
        )
        no2x2(sg, lambda p: sg.grid[p] == 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
