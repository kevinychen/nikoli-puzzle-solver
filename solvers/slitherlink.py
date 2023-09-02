from lib import *


class Slitherlink(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, 1))

        for p in sg.grid.keys() - puzzle.points:
            sg.solver.add(sg.grid[p] == 0)

        for p, number in puzzle.texts.items():
            sg.solver.add(Sum([sg.grid[p] != n.symbol for n in sg.edge_sharing_neighbors(p)]) == number)

        for i in range(2):
            require_continuous(sg, lambda q: sg.grid[q] == i)

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
