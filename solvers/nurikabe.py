from lib import *


class Nurikabe(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if p in puzzle.texts:
                # All numbers correspond to a different region with the given size, rooted at the number
                sg.solver.add(sg.grid[p] == 0)
                sg.solver.add(rc.region_size_grid[p] == puzzle.texts[p])
                sg.solver.add(rc.parent_grid[p] == R)
            else:
                # No islands without a number
                sg.solver.add(Implies(sg.grid[p] == 0, rc.parent_grid[p] != R))

        # No two regions with the same color may be adjacent
        for p, q in puzzle.edges():
            sg.solver.add(Implies(rc.region_id_grid[p] != rc.region_id_grid[q], sg.grid[p] != sg.grid[q]))

        continuous_region(sg, rc, lambda r: sg.grid[r] == 1)
        no2x2(sg, lambda r: sg.grid[r] == 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
