from solvers.utils import *


class Fillomino(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(1, puzzle.height * puzzle.width))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.lattice.points:
            if p in puzzle.texts:
                sg.solver.add(sg.cell_is(p, int(puzzle.texts[p])))
            sg.solver.add(sg.grid[p] == rc.region_size_grid[p])
            for region_size, region_id in zip(
                    sg.lattice.edge_sharing_neighbors(rc.region_size_grid, p),
                    sg.lattice.edge_sharing_neighbors(rc.region_id_grid, p)):
                sg.solver.add(Implies(
                    rc.region_size_grid[p] == region_size.symbol, rc.region_id_grid[p] == region_id.symbol))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for row in range(puzzle.height):
            for col in range(puzzle.width - 1):
                if solved_grid[Point(row, col)] != solved_grid[Point(row, col + 1)]:
                    solution.vertical_borders.add(Point(row, col))
        for row in range(puzzle.height - 1):
            for col in range(puzzle.width):
                if solved_grid[Point(row, col)] != solved_grid[Point(row + 1, col)]:
                    solution.horizontal_borders.add(Point(row, col))
