from collections import defaultdict

from lib import *


class Nuribou(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False)

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 0) == (rc.region_id_grid[p] == -1))

        # Each number is the root of a white region
        tree = defaultdict(var)
        for p in sg.grid:
            sg.solver.add(tree[p] >= 0)
            sg.solver.add((sg.grid[p] == 0) == (tree[p] != 0))
            sg.solver.add((p in puzzle.texts) == (tree[p] == 1))
            sg.solver.add(
                Or(
                    tree[p] <= 1,
                    *[And(tree[n.location] != 0, tree[n.location] < tree[p]) for n in sg.edge_sharing_neighbors(p)]
                )
            )

        # The number represents the size of the region
        for p, number in puzzle.texts.items():
            require_region_area(sg, p, lambda q: sg.grid[q] == 0, number)

        # Black squares must be strips of width 1
        for junction in junctions(sg):
            sg.solver.add(Sum([sg.grid[q] == 1 for q in junction]) <= 2)

        # Two adjacent black strips cannot have the same length
        for p in sg.grid:
            for diagonal in set(sg.vertex_sharing_neighbors(p)) - set(sg.edge_sharing_neighbors(p)):
                sg.solver.add(
                    Implies(
                        And(sg.grid[p] == 1, diagonal.symbol == 1),
                        rc.region_size_grid[p] != rc.region_size_grid[diagonal.location],
                    )
                )

        no_adjacent_regions(sg, rc)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
