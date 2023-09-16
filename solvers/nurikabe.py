from lib import *


class Nurikabe(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Each white region is connected and rooted at a number
        trees = {p: var() for p in sg.grid}
        for p in sg.grid:
            sg.solver.add(
                Or(
                    sg.grid[p] != 0,
                    p in puzzle.texts,
                    *[And(n.symbol == 0, trees[n.location] < trees[p]) for n in sg.edge_sharing_neighbors(p)]
                )
            )

        # Black region is connected
        black_root = var()
        for p in sg.grid:
            sg.solver.add(
                Or(
                    sg.grid[p] != 1,
                    black_root == sg.lattice.point_to_index(p),
                    *[And(n.symbol == 1, trees[n.location] < trees[p]) for n in sg.edge_sharing_neighbors(p)]
                )
            )

        # Each number is the size of the region
        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == 0)
            require_region_area(sg, p, lambda q: sg.grid[q] == 0, number)

        no2x2(sg, lambda q: sg.grid[q] == 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
