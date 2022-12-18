from lib import *


class Kakuro(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, 9))

        line_totals = []
        for p in puzzle.symbols:
            sg.solver.add(sg.grid[p] == 1)
            # The number for a horizontal row going east is actually written on the northeast of the square
            for text_dir, v in (Directions.NE, Directions.E), (Directions.SW, Directions.S):
                line_totals.append(
                    (
                        puzzle.edge_texts.get((p, text_dir)),
                        sight_line(sg, p.translate(v), v, lambda q: q in sg.grid and q not in puzzle.symbols),
                    )
                )
        for total, line in line_totals:
            if line:
                sg.solver.add(Distinct([sg.grid[p] for p in line]))
                if total is not None:
                    sg.solver.add(Sum([sg.grid[p] for p in line]) == total)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.texts[p] = solved_grid[p]
