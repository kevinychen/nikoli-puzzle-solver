from solvers.utils import *


class Slitherlink(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            RectangularLattice(
                [Point(row, col) for row in range(-1, puzzle.height + 1) for col in range(-1, puzzle.width + 1)]),
            grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            if not (0 <= p.x < puzzle.width and 0 <= p.y < puzzle.height):
                # Add dummy OUTSIDE squares around the grid, so we can assert all OUTSIDE squares are connected
                sg.solver.add(sg.cell_is(p, 0))
            elif p in puzzle.texts:
                sg.solver.add(
                    PbEq([(sg.grid[p] != n.symbol, 1) for n in sg.edge_sharing_neighbors(p)], int(puzzle.texts[p])))

        for symbol in range(2):
            continuous_region(sg, rc, lambda q: sg.cell_is(q, symbol))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for row in range(puzzle.height):
            for col in range(puzzle.width + 1):
                if solved_grid[Point(row, col - 1)] != solved_grid[Point(row, col)]:
                    solution.vertical_borders[Point(row, col)] = True
        for row in range(puzzle.height + 1):
            for col in range(puzzle.width):
                if solved_grid[Point(row - 1, col)] != solved_grid[Point(row, col)]:
                    solution.horizontal_borders[Point(row, col)] = True
