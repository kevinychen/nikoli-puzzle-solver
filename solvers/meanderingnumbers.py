from lib import *


class MeanderingNumbers(AbstractSolver):
    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        for region in puzzle.regions():
            # Each region must have numbers from 1 to n in an orthogonally connected path
            sg.solver.add(Or([sg.grid[p] == 1 for p in region]))
            for p in region:
                sg.solver.add(
                    Or(
                        sg.grid[p] == len(region),
                        *[sg.grid[q] == sg.grid[p] + 1 for q in sg.lattice.edge_sharing_points(p) if q in region]
                    )
                )

                # Two of the same number may not be adjacent
                sg.solver.add(And([sg.grid[n.location] != sg.grid[p] for n in sg.vertex_sharing_neighbors(p)]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
