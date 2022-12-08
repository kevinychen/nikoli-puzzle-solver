from solvers.utils import *


class Skyscrapers(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_square_lattice(puzzle.width),
            grilops.make_number_range_symbol_set(1, puzzle.width))

        border_lines = []
        for i in range(puzzle.width):
            border_lines.append((Point(i, -1), Vector(0, 1)))
            border_lines.append((Point(i, puzzle.width), Vector(0, -1)))
            border_lines.append((Point(-1, i), Vector(1, 0)))
            border_lines.append((Point(puzzle.width, i), Vector(-1, 0)))
        for p, v in border_lines:
            if p in puzzle.texts:
                line = sight_line(sg, p.translate(v), v)
                sg.solver.add(PbEq(
                    [(And([sg.grid[q] > sg.grid[r] for r in line[:i]]), 1) for i, q in enumerate(line)],
                    int(puzzle.texts[p])))
        for p, text in puzzle.texts.items():
            if 0 <= p.y < puzzle.height and 0 <= p.x < puzzle.width:
                sg.solver.add(sg.cell_is(p, int(text)))

        distinct_rows_and_columns(sg)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
