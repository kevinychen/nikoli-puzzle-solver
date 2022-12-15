from lib import *


class LITS(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)
        sc = ShapeConstrainer(
            sg.lattice, puzzle.polyominoes(4), sg.solver,
            allow_rotations=True, allow_reflections=True, allow_copies=True)

        # Each region has one piece
        for i, region in enumerate(puzzle.regions()):
            region_root = var()
            for p in region:
                sg.solver.add(Implies(sg.grid[p] == 1, sc.shape_instance_grid[p] == region_root))
                sg.solver.add(Implies(sg.grid[p] == 0, sc.shape_type_grid[p] == -1))
            sg.solver.add(Or([region_root == sg.lattice.point_to_index(p) for p in region]))
            sg.solver.add(Or([sg.grid[p] == 1 for p in region]))

        # No two pieces with the same shape may be adjacent
        for p, q in puzzle.edges():
            sg.solver.add(Implies(
                sc.shape_instance_grid[p] != sc.shape_instance_grid[q], sc.shape_type_grid[p] != sc.shape_type_grid[q]))

        # No 2x2 black square (or for the hex version, no black triangle)
        for vertex in puzzle.vertices():
            sg.solver.add(Or([sg.grid[p] == 0 for p in vertex]))

        continuous_region(sg, rc, lambda r: sg.grid[r] == 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
