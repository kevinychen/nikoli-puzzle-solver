from lib import *


class TentaishoSpiralGalaxies(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, puzzle.height * puzzle.width))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        centers = (
            *[(p.y, p.x) for p in puzzle.symbols],
            *[(p.y + v.vector.dy / 2, p.x + v.vector.dx / 2) for (p, v) in puzzle.borders],
        )

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

            # Each square must be part of some galaxy, and the opposite square must be in the same galaxy
            choices = []
            for y, x in centers:
                opposite = Point(2 * y - p.y, 2 * x - p.x)
                if opposite in sg.lattice.points:
                    choices.append(And(
                        sg.cell_is(p, sg.lattice.point_to_index(Point(int(y), int(x)))),
                        sg.grid[p] == sg.grid[opposite]))
            sg.solver.add(Or(choices))

        # All galaxies have at least one square, rooted at the center (or closest square to the center)
        for y, x in centers:
            sg.solver.add(rc.parent_grid[Point(int(y), int(x))] == R)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(sg, solved_grid)
