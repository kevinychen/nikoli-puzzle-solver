from lib import *


class Slicy(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        shapes = [
            Shape([Vector(0, 0), Vector(1, 1), Vector(1, 3), Vector(2, 4)]),
            Shape([Vector(0, 0), Vector(1, 1), Vector(2, 2), Vector(2, 4)]),
            Shape([Vector(0, 0), Vector(1, 1), Vector(2, 2), Vector(3, 3)]),
            Shape([Vector(0, 0), Vector(0, 4), Vector(1, 1), Vector(1, 3)]),
            Shape([Vector(0, 0), Vector(1, 1), Vector(1, 3), Vector(2, 0)]),
        ]

        sg = init_symbol_grid(puzzle.get_lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)
        sc = ShapeConstrainer(
            sg.lattice, shapes, sg.solver, allow_rotations=True, allow_reflections=True, allow_copies=True)

        # Each region has one piece
        for i, region in enumerate(puzzle.get_regions(sg.lattice)):
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

        # No "triangle" of black regions
        for p in sg.grid:
            for box in ((p, p.translate(Directions.NE), p.translate(Directions.NW)),
                        (p, p.translate(Directions.SW), p.translate(Directions.SE))):
                if all([p in sg.grid for p in box]):
                    sg.solver.add(Or([sg.cell_is(p, 0) for p in box]))

        continuous_region(sg, rc, lambda q: sg.cell_is(q, 1))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
