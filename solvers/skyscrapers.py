from lib import *


class Skyscrapers(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for p, v in puzzle.entrance_points():
            sg.solver.add(Distinct([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]))
            if p in puzzle.texts:
                line = sight_line(sg, p.translate(v), v)
                sg.solver.add(
                    Sum([And([sg.grid[q] > sg.grid[r] for r in line[:i]]) for i, q in enumerate(line)])
                    == puzzle.texts[p]
                )

        for p, number in puzzle.texts.items():
            if p in puzzle.points:
                sg.solver.add(sg.grid[p] == number)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
