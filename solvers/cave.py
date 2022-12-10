from lib import *


class Cave(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            RectangularLattice(
                [Point(row, col) for row in range(-1, puzzle.height + 1) for col in range(-1, puzzle.width + 1)]),
            grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if not puzzle.in_bounds(p):
                sg.solver.add(sg.cell_is(p, 1))
        for p, text in puzzle.texts.items():
            all_is_visible = [sg.cell_is(p, 0)]
            for direction in sg.lattice.edge_sharing_directions():
                line = sight_line(sg, p, direction)
                for i in range(1, len(line)):
                    all_is_visible.append(And([sg.cell_is(q, 0) for q in line[:i+1]]))
            sg.solver.add(Sum(all_is_visible) == text)

        for i in range(2):
            continuous_region(sg, rc, lambda q: sg.cell_is(q, i))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if puzzle.in_bounds(p) and solved_grid[p] == 1:
                solution.shaded[p] = True
