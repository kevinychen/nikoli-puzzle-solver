from lib import *


class Slitherlink(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            RectangularLattice(
                [Point(row, col) for row in range(-1, puzzle.height + 1) for col in range(-1, puzzle.width + 1)]),
            grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if not puzzle.in_bounds(p):
                sg.solver.add(sg.cell_is(p, 0))
            elif p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[p] != n.symbol for n in sg.edge_sharing_neighbors(p)]) == puzzle.texts[p])

        for i in range(2):
            continuous_region(sg, rc, lambda q: sg.cell_is(q, i))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(sg, solved_grid)
