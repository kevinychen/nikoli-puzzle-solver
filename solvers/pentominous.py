from lib import *


class Pentominous(AbstractSolver):
    def run(self, puzzle, solve):
        # Pieces in lexicographic order of their point sets (to be consistent with #get_polyominoes)
        letters = "ILYNPUVTWFZX"

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(letters) - 1))
        sc = ShapeConstrainer(
            sg.lattice,
            puzzle.polyominoes(5),
            sg.solver,
            allow_rotations=True,
            allow_reflections=True,
            allow_copies=True,
        )

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == sc.shape_type_grid[p])

            # Must be right shape if letter is given
            for i, letter in enumerate(letters):
                if puzzle.texts.get(p) == letter:
                    sg.solver.add(sg.grid[p] == i)

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
