from lib import *


class LITS(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        shapes = [
            Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0), Vector(2, 1)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(2, 0), Vector(3, 0)]),
            Shape([Vector(0, 0), Vector(0, 1), Vector(0, 2), Vector(1, 1)]),
            Shape([Vector(0, 0), Vector(1, 0), Vector(1, 1), Vector(2, 1)]),
        ]

        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)
        sc = ShapeConstrainer(
            sg.lattice, shapes, sg.solver, allow_rotations=True, allow_reflections=True, allow_copies=True)

        # Each region has one piece
        for i, region in enumerate(puzzle.get_regions(sg.lattice.points)):
            region_root = Int(f'region{i}')
            for p in region:
                sg.solver.add(Implies(sg.cell_is(p, 1), sc.shape_instance_grid[p] == region_root))
                sg.solver.add(Implies(sg.cell_is(p, 0), sc.shape_type_grid[p] == -1))
            sg.solver.add(Or([region_root == sg.lattice.point_to_index(p) for p in region]))
            sg.solver.add(Or([sg.cell_is(p, 1) for p in region]))

        # No two pieces with the same shape may be adjacent
        for p in sg.grid:
            for shape_instance, shape_type in \
                    zip(sg.lattice.edge_sharing_neighbors(sc.shape_instance_grid, p),
                        sg.lattice.edge_sharing_neighbors(sc.shape_type_grid, p)):
                sg.solver.add(
                    Implies(
                        And(sg.cell_is(p, 1), sc.shape_type_grid[p] == shape_type.symbol),
                        sc.shape_instance_grid[p] == shape_instance.symbol))

        continuous_region(sg, rc, lambda q: sg.cell_is(q, 1))
        no2x2(sg, 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
