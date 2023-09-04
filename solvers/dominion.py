from lib import *


class Dominion(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False)

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 1) == (rc.region_id_grid[p] == -1))

        # Each unshaded area contains all copies of a single letter
        texts = list(set(puzzle.texts.values()))
        for text in texts:
            points = [q for q in puzzle.texts if puzzle.texts[q] == text]
            for p in points:
                sg.solver.add(rc.region_id_grid[p] == sg.lattice.point_to_index(points[0]))

        # Shaded squares are dominoes
        for p in sg.grid:
            sg.solver.add(Implies(sg.grid[p] == 1, Sum([n.symbol for n in sg.edge_sharing_neighbors(p)]) == 1))

        no_adjacent_regions(sg, rc)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
