from lib import *


class ChocoBanana(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False)

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 1) == (rc.region_id_grid[p] == -1))

        # Black regions must be rectangular
        for junction in junctions(sg):
            sg.solver.add(Sum([sg.grid[p] == 0 for p in junction]) != 1)

        # White regions must not be rectangular - assume the root fails
        for p in sg.grid:
            sg.solver.add(
                Implies(
                    rc.parent_grid[p] == R,
                    Or([Sum([sg.grid[q] == 1 for q in junction]) == 1 for junction in junctions(sg) if p in junction]),
                )
            )

        # The number represents the size of the region
        for p, number in puzzle.texts.items():
            require_region_area(sg, p, lambda q: sg.grid[p] == sg.grid[q], number)

        no_adjacent_regions(sg, rc)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
