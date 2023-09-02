from lib import *


class SlantGokigenNaname(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        trees = SymbolGrid(
            grilops.get_rectangle_lattice(puzzle.height + 1, puzzle.width + 1),
            grilops.make_number_range_symbol_set(1, (puzzle.height + 1) * (puzzle.width + 1)),
            solver=sg.solver,
        )

        for junction, number in puzzle.junction_texts.items():
            p1, p2, p3, p4 = sorted(junction)
            pointing_ats = sg.grid.get(p1) == 0, sg.grid.get(p2) == 1, sg.grid.get(p3) == 1, sg.grid.get(p4) == 0
            neighbors = Directions.NW, Directions.NE, Directions.SW, Directions.SE

            # Numbers specify how many slants point to it
            sg.solver.add(Sum(pointing_ats) == number)

            # Points can be numbered such that each one other than 1 has a parent (to ensure there are no loops)
            for pointing_at, n in zip(pointing_ats, neighbors):
                sg.solver.add(Implies(pointing_at, trees.grid[p4] != trees.grid.get(p4.translate(n))))
            sg.solver.add(
                Or(
                    trees.grid[p4] == 1,
                    Sum(
                        [
                            And(pointing_at, trees.grid.get(p4.translate(n)) < trees.grid[p4])
                            for pointing_at, n in zip(pointing_ats, neighbors)
                            if p4.translate(n) in trees.grid
                        ]
                    )
                    == 1,
                )
            )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            solution.symbols[p] = Symbols.NE_TO_SW if solved_grid[p] == 1 else Symbols.NW_TO_SE
