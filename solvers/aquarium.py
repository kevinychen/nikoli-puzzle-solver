from solvers.utils import *


class Aquarium(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, 1))

        # Each region must have all water at the same level
        for region in puzzle.to_regions(sg.lattice.points):
            sg.solver.add(Or(
                [And([sg.cell_is(p, 1 if p.y >= height else 0) for p in region])
                 for height in range(puzzle.height + 1)]))

        # Satisfy water counts
        border_lines = []
        for row in range(puzzle.height):
            border_lines.append((Point(row, -1), Vector(0, 1)))
        for col in range(puzzle.width):
            border_lines.append((Point(-1, col), Vector(1, 0)))
        for p, v in border_lines:
            if p in puzzle.texts:
                sg.solver.add(PbEq(
                    [(sg.cell_is(q, 1), 1) for q in sight_line(sg, p.translate(v), v)], int(puzzle.texts[p])))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.lattice.points:
            if solved_grid[p] == 1:
                solution.shaded.add(p)
