from lib import *


class Kakuro(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, 9))

        line_totals = []
        for p in puzzle.symbols:
            sg.solver.add(sg.cell_is(p, 1))
            # The number for a horizontal row going east is actually written on the northeast of the square
            for text_dir, line_dir in (Directions.NE, Directions.E), (Directions.SW, Directions.S):
                if (p, text_dir) in puzzle.edge_texts:
                    line_totals.append((
                        puzzle.edge_texts[p, text_dir],
                        sight_line(sg, p.translate(line_dir), line_dir, lambda q: q not in puzzle.symbols)))
        for total, line in line_totals:
            sg.solver.add(Sum([sg.grid[p] for p in line]) == total)
            sg.solver.add(Distinct([sg.grid[p] for p in line]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.texts[p] = solved_grid[p]
