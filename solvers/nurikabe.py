from lib import *


class Nurikabe(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
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

        # No 2x2 block of shaded squares
        for vertex in puzzle.vertices():
            sg.solver.add(Or([sg.grid[p] == 0 for p in vertex]))

        continuous_region(sg, rc, lambda r: sg.grid[r] == 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
