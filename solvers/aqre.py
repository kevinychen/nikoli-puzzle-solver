from lib import *


class Aqre(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Number of black squares in each region is correct
        for p, number in puzzle.texts.items():
            region = next(region for region in puzzle.regions() if p in region)
            sg.solver.add(Sum([sg.grid[q] for q in region]) == number)

        # No four-in-a-row
        for p in sg.grid:
            for v in sg.lattice.edge_sharing_directions():
                points = [Point(p.y + v.vector.dy * i, p.x + v.vector.dx * i) for i in range(4)]
                sg.solver.add(Or([sg.grid[p] != sg.grid.get(q) for q in points]))

        require_continuous(sg, lambda q: sg.grid[q] == 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
