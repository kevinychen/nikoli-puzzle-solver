from lib import *


class Hitori(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, puzzle.width))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.cell_is_one_of(p, (0, number)))

        # Each number appears in each row and in each column at most once
        for i in range(1, puzzle.width + 1):
            for p, v in puzzle.entrance_points():
                sg.solver.add(Sum([sg.grid[q] == i for q in sight_line(sg, p.translate(v), v)]) <= 1)

        continuous_region(sg, rc, lambda q: sg.grid[q] != 0)
        no_adjacent_symbols(sg, 0)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] == 0:
                solution.shaded[p] = True
