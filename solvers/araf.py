from lib import *


class Araf(AbstractSolver):
    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

            if p not in puzzle.texts:
                sg.solver.add(rc.parent_grid[p] != R)

        # Require the smaller number to be the root of each region.
        # For each number, either it is the larger number, or it needs to be paired with a larger number.
        for p, number1 in puzzle.texts.items():
            choices = [rc.parent_grid[p] != R]
            for q, number2 in puzzle.texts.items():
                if number1 < number2 and abs(p.y - q.y) + abs(p.x - q.x) + 1 < number2:
                    choices.append(
                        And(
                            rc.region_id_grid[p] == rc.region_id_grid[q],
                            rc.region_size_grid[p] > number1,
                            rc.region_size_grid[p] < number2,
                        )
                    )
            sg.solver.add(Or(choices))

        sg.solver.add(Sum([rc.parent_grid[p] == R for p in puzzle.texts]) == len(puzzle.texts) // 2)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(puzzle, solved_grid)
