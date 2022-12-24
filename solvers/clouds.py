from lib import *


class Clouds(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        # All clouds must be rectangles at least 2 cells wide and 2 cells long
        for p in sg.grid:
            diagonals = diagonal_neighbors(sg, p)
            for q, intermediates in diagonals:
                sg.solver.add(
                    Implies(And(sg.grid[p] == 1, sg.grid[q] == 1), And([sg.grid[r] == 1 for r in intermediates]))
                )
            sg.solver.add(Implies(sg.grid[p] == 1, Or([sg.grid[q] == 1 for q, _ in diagonals])))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
