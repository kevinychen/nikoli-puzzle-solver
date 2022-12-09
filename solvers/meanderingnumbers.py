from solvers.utils import *


class MeanderingNumbers(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, puzzle.height * puzzle.width))

        for p, text in puzzle.texts.items():
            sg.solver.add(sg.cell_is(p, text))

        for region in puzzle.to_regions(sg.lattice.points):
            # Each region must have numbers from 1 to n in an orthogonally connected path
            sg.solver.add(Or([sg.cell_is(p, 1) for p in region]))
            for p in region:
                sg.solver.add(Or(
                    sg.cell_is(p, len(region)),
                    *[sg.grid[q] == sg.grid[p] + 1 for q in sg.lattice.edge_sharing_points(p) if q in region]))

                # Two of the same number may not be adjacent
                sg.solver.add(And([sg.grid[n.location] != sg.grid[p] for n in sg.vertex_sharing_neighbors(p)]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
