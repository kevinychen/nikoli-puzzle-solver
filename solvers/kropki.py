from lib import *


class Kropki(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for p, q in puzzle.edges():
            white_condition = Or(sg.grid[p] == sg.grid[q] + 1, sg.grid[p] + 1 == sg.grid[q])
            black_condition = Or(sg.grid[p] == sg.grid[q] * 2, sg.grid[p] * 2 == sg.grid[q])
            symbol = puzzle.junctions.get(frozenset((p, q)))
            if symbol is None:
                sg.solver.add(Not(Or(white_condition, black_condition)))
            elif symbol.is_black():
                sg.solver.add(black_condition)
            else:
                sg.solver.add(white_condition)

        # Rows and columns are distinct
        for p, v in puzzle.entrance_points():
            sg.solver.add(Distinct([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            solution.texts[p] = solved_grid[p]
