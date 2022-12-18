from lib import *


class Heteromino(AbstractSolver):
    def run(self, puzzle, solve):
        shapes = puzzle.polyominoes(3, include_rotations_and_reflections=True)

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(-1, len(shapes) - 1))
        sc = ShapeConstrainer(sg.lattice, shapes, sg.solver, allow_copies=True)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == sc.shape_type_grid[p])
            sg.solver.add((sg.grid[p] == -1) == (p in puzzle.shaded))

        # No two adjacent regions may be the same shape
        for p, q in puzzle.edges():
            sg.solver.add(
                Implies(
                    sc.shape_instance_grid[p] != sc.shape_instance_grid[q],
                    sc.shape_type_grid[p] != sc.shape_type_grid[q],
                )
            )

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
