from lib import *


class Heteromino(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        shapes = [
            Shape([Vector(0, 0), Vector(0, 1), Vector(0, 2)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0)]),
            Shape([Vector(0, 0), Vector(0, 1), Vector(1, 0)]),
            Shape([Vector(0, 0), Vector(0, 1), Vector(1, 1)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(1, 1)]),
            Shape([Vector(0, 1), Vector(1, 0), Vector(1, 1)]),
        ]

        sg = init_symbol_grid(
            RectangularLattice(
                [Point(row, col) for row in range(-1, puzzle.height + 1) for col in range(-1, puzzle.width + 1)]),
            grilops.make_number_range_symbol_set(-1, len(shapes) - 1))
        sc = ShapeConstrainer(sg.lattice, shapes, sg.solver, allow_copies=True)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == sc.shape_type_grid[p])
            if not (0 <= p.x < puzzle.width and 0 <= p.y < puzzle.height) or p in puzzle.shaded:
                sg.solver.add(sg.cell_is(p, -1))
            else:
                sg.solver.add(sg.grid[p] != -1)

                # No two adjacent regions may be the same shape
                for shape_type, shape_instance in zip(
                        sg.lattice.edge_sharing_neighbors(sc.shape_type_grid, p),
                        sg.lattice.edge_sharing_neighbors(sc.shape_instance_grid, p)):
                    sg.solver.add(Implies(
                        sc.shape_type_grid[p] == shape_type.symbol, sc.shape_instance_grid[p] == shape_instance.symbol))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(sg, solved_grid)
