from lib import *


class Juosan(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, 2))

        # Each number represents either the number of -'s or the number of |'s
        for (p, _), number in puzzle.edge_texts.items():
            region = next(region for region in puzzle.regions() if p in region)
            sg.solver.add(
                Or(
                    Sum([sg.grid[q] == 1 for q in region]) == number,
                    Sum([sg.grid[q] == 2 for q in region]) == number,
                )
            )

        # -'s cannot extend more than two cells vertically
        for p in sg.grid:
            sg.solver.add(Not(And([sg.grid.get(Point(p.y + i, p.x)) == 1 for i in range(3)])))

        # |'s cannot extend more than two cells horizontally
        for p in sg.grid:
            sg.solver.add(Not(And([sg.grid.get(Point(p.y, p.x + i)) == 2 for i in range(3)])))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            solution.symbols[p] = Symbols.HORIZONTAL_LINE if solved_grid[p] == 1 else Symbols.VERTICAL_LINE
