from lib import *


class Pentominous(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        shapes = [
            Shape([Vector(0, 1), Vector(0, 2), Vector(1, 0), Vector(1, 1), Vector(2, 1)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0), Vector(3, 0), Vector(4, 0)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0), Vector(3, 0), Vector(3, 1)]),
            Shape([Vector(0, 1), Vector(1, 0), Vector(1, 1), Vector(2, 0), Vector(3, 0)]),
            Shape([Vector(0, 0), Vector(0, 1), Vector(1, 0), Vector(1, 1), Vector(2, 0)]),
            Shape([Vector(0, 0), Vector(0, 1), Vector(0, 2), Vector(1, 1), Vector(2, 1)]),
            Shape([Vector(0, 0), Vector(0, 2), Vector(1, 0), Vector(1, 1), Vector(1, 2)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0), Vector(2, 1), Vector(2, 2)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(1, 1), Vector(2, 1), Vector(2, 2)]),
            Shape([Vector(0, 1), Vector(1, 0), Vector(1, 1), Vector(1, 2), Vector(2, 1)]),
            Shape([Vector(0, 1), Vector(1, 0), Vector(1, 1), Vector(2, 1), Vector(3, 1)]),
            Shape([Vector(0, 0), Vector(0, 1), Vector(1, 1), Vector(2, 1), Vector(2, 2)]),
        ]
        letters = 'FILNPTUVWXYZ'

        sg = init_symbol_grid(puzzle.get_lattice(), grilops.make_number_range_symbol_set(0, len(shapes) - 1))
        sc = ShapeConstrainer(
            sg.lattice, shapes, sg.solver, allow_rotations=True, allow_reflections=True, allow_copies=True)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == sc.shape_type_grid[p])

            # Must be right shape if letter is given
            for i, letter in enumerate(letters):
                if puzzle.texts.get(p) == letter:
                    sg.solver.add(sg.cell_is(p, i))

            # No two adjacent regions may be the same shape
            for shape_type, shape_instance in zip(
                    sg.lattice.edge_sharing_neighbors(sc.shape_type_grid, p),
                    sg.lattice.edge_sharing_neighbors(sc.shape_instance_grid, p)):
                sg.solver.add(Implies(
                    sc.shape_type_grid[p] == shape_type.symbol, sc.shape_instance_grid[p] == shape_instance.symbol))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(sg, solved_grid)
