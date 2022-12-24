from lib import *


class MeanderingNumbers(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, len(puzzle.points)))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        # Each region must have numbers from 1 to n in an orthogonally connected path
        for region in puzzle.regions():
            sg.solver.add(Or([sg.grid[p] == 1 for p in region]))
            for p in region:
                sg.solver.add(
                    Or(
                        sg.grid[p] == len(region),
                        *[sg.grid[q] == sg.grid[p] + 1 for q in sg.lattice.edge_sharing_points(p) if q in region]
                    )
                )

        # Two of the same number may not be adjacent
        for p, q in puzzle.edges(include_diagonal=True):
            sg.solver.add(sg.grid[p] != sg.grid[q])

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
