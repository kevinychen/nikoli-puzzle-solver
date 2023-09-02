from lib import *


class Thermometers(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Satisfy mercury counts
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        # Each thermometer must be filled from bottom to top
        for thermo in puzzle.thermo:
            for p, q in zip(thermo, thermo[1:]):
                sg.solver.add(sg.grid[p] >= sg.grid[q])

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
