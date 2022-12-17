from lib import *


class Futoshiki(AbstractSolver):
    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        for p, q in puzzle.edges():
            symbol = puzzle.junctions.get(frozenset((p, q)))
            if symbol is not None:
                (v,) = symbol.get_arrows()
                big, small = (p, q) if p.translate(v) == q else (q, p)
                sg.solver.add(sg.grid[big] > sg.grid[small])

        # Rows and columns are distinct
        for p, v in puzzle.entrance_points():
            sg.solver.add(Distinct([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
