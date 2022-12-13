from lib import *


class Nurikabe(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.get_lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if p in puzzle.texts:
                # All numbers correspond to a different region with the given size, rooted at the number
                sg.solver.add(sg.cell_is(p, 0))
                sg.solver.add(rc.region_id_grid[p] == sg.lattice.point_to_index(p))
                sg.solver.add(rc.region_size_grid[p] == puzzle.texts[p])
                sg.solver.add(rc.parent_grid[p] == R)
            else:
                # No islands without a number
                sg.solver.add(Implies(sg.cell_is(p, 0), rc.parent_grid[p] != R))

        # No two regions with the same color may be adjacent
        for p in sg.grid:
            for color, region_id in zip(
                    sg.lattice.edge_sharing_neighbors(sg.grid, p),
                    sg.lattice.edge_sharing_neighbors(rc.region_id_grid, p)):
                sg.solver.add(Implies(sg.grid[p] == color.symbol, rc.region_id_grid[p] == region_id.symbol))

        continuous_region(sg, rc, lambda q: sg.cell_is(q, 1))
        no2x2(sg, 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
