from lib import *


class Fillomino(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(1, puzzle.height * puzzle.width))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.cell_is(p, number))

        # Adjacent regions cannot have the same size
        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_size_grid[p])
            for region_size, region_id in zip(
                    sg.lattice.edge_sharing_neighbors(rc.region_size_grid, p),
                    sg.lattice.edge_sharing_neighbors(rc.region_id_grid, p)):
                sg.solver.add(Implies(
                    rc.region_size_grid[p] == region_size.symbol, rc.region_id_grid[p] == region_id.symbol))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(sg, solved_grid)
