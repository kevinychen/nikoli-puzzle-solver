from lib import *


class Shimaguni(AbstractSolver):
    def run(self, puzzle, solve):
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == (rc.region_id_grid[p] != -1))

        # Number of black squares in each region is correct
        for p, number in puzzle.texts.items():
            sg.solver.add(Sum([sg.grid[q] for q in sg.grid if regions[p] == regions[q]]) == number)

        # Each region has one piece
        for region in puzzle.regions():
            region_root = var()
            for p in region:
                sg.solver.add(Implies(sg.grid[p] == 1, rc.region_id_grid[p] == region_root))
                sg.solver.add(Implies(sg.grid[p] == 0, rc.region_id_grid[p] == -1))
            sg.solver.add(Or([region_root == sg.lattice.point_to_index(p) for p in region]))
            sg.solver.add(Or([sg.grid[p] == 1 for p in region]))

        # Two regions with the same number of black cells may not be adjacent
        region_areas = [var() for _ in puzzle.regions()]
        for i, region in enumerate(puzzle.regions()):
            for p in region:
                sg.solver.add(Or(rc.region_size_grid[p] == region_areas[i], rc.region_id_grid[p] == -1))
        for p, q in puzzle.edges():
            if regions[p] != regions[q]:
                sg.solver.add(region_areas[regions[p]] != region_areas[regions[q]])

        no_adjacent_regions(sg, rc)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
