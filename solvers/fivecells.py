from lib import *


class FiveCells(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver, min_region_size=5, max_region_size=5)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

        for p, number in puzzle.texts.items():
            num_borders = len(sg.lattice.edge_sharing_directions()) - len(sg.edge_sharing_neighbors(p))
            sg.solver.add(Sum([sg.grid[p] != n.symbol for n in sg.edge_sharing_neighbors(p)]) == number - num_borders)

        # Ensure solution is unique
        for p in sg.grid:
            sg.solver.add(sg.grid[p] >= sg.lattice.point_to_index(p))

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
