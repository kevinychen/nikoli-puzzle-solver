from lib import *


class Cave(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if p not in puzzle.points:
                sg.solver.add(sg.grid[p] == 1)

        for p, number in puzzle.texts.items():
            all_is_visible = [sg.grid[p] == 0]
            for direction in sg.lattice.edge_sharing_directions():
                line = sight_line(sg, p, direction)
                for i in range(1, len(line)):
                    all_is_visible.append(And([sg.grid[q] == 0 for q in line[:i+1]]))
            sg.solver.add(Sum(all_is_visible) == number)

        for i in range(2):
            continuous_region(sg, rc, lambda q: sg.grid[q] == i)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p in puzzle.points and solved_grid[p] == 1:
                solution.shaded[p] = True
