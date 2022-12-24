from lib import *


class StatuePark(AbstractSolver):
    def run(self, puzzle, solve):
        size = int(puzzle.parameters["size"])
        assert size in (4, 5)

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)
        sc = ShapeConstrainer(
            sg.lattice, puzzle.polyominoes(size), sg.solver, allow_rotations=True, allow_reflections=True
        )

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == (sc.shape_instance_grid[p] != -1))

        for p, symbol in puzzle.symbols.items():
            if symbol.is_circle():
                sg.solver.add(sg.grid[p] == symbol.is_black())

        # No two pieces may touch
        for p, q in puzzle.edges():
            sg.solver.add(
                Implies(And(sg.grid[p] == 1, sg.grid[q] == 1), sc.shape_instance_grid[p] == sc.shape_instance_grid[q])
            )

        continuous_region(sg, rc, lambda r: sg.grid[r] == 0)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
