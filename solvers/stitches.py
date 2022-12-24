from collections import defaultdict

from lib import *


class Stitches(AbstractSolver):
    def run(self, puzzle, solve):
        stitches = int(puzzle.parameters["stitches"])
        directions = puzzle.lattice_type.edge_sharing_directions()
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(-1, len(directions) - 1))

        # Satisfy hole counts
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] != -1 for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        # Each block must be stitched to all neighbor blocks
        region_borders = defaultdict(list)
        for p in sg.grid:
            for n in sg.edge_sharing_neighbors(p):
                if regions[p] != regions[n.location]:
                    region_borders[regions[p], regions[n.location]].append((p, n.direction))
        for borders in region_borders.values():
            sg.solver.add(Sum([sg.grid[p] == directions.index(direction) for p, direction in borders]) == stitches)

        for p in sg.grid:
            for v in directions:
                # Directions must match up
                sg.solver.add(
                    Implies(
                        sg.grid[p] == directions.index(v),
                        sg.grid.get(p.translate(v)) == directions.index(sg.lattice.opposite_direction(v)),
                    )
                )

                # Stitches can only be between two different blocks
                if regions[p] == regions.get(p.translate(v)):
                    sg.solver.add(sg.grid[p] != directions.index(v))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != -1:
                solution.symbols[p] = Symbols.VERY_SMALL_WHITE_CIRCLE
                solution.lines[p, p.translate(directions[solved_grid[p]])] = True
