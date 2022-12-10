from lib import *


class Kakuro(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(1, 9))

        line_totals = []
        for p in puzzle.symbols:
            sg.solver.add(sg.cell_is(p, 1))
            if (p, Directions.NE) in puzzle.edge_texts:
                line_totals.append((
                    int(puzzle.edge_texts[p, Directions.NE]),
                    sight_line(sg, Point(p.y, p.x + 1), Directions.E, lambda q: q not in puzzle.symbols)))
            if (p, Directions.SW) in puzzle.edge_texts:
                line_totals.append((
                    int(puzzle.edge_texts[p, Directions.SW]),
                    sight_line(sg, Point(p.y + 1, p.x), Directions.S, lambda q: q not in puzzle.symbols)))
        for total, line in line_totals:
            sg.solver.add(Sum([sg.grid[p] for p in line]) == total)
            sg.solver.add(Distinct([sg.grid[p] for p in line]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.texts[p] = solved_grid[p]
