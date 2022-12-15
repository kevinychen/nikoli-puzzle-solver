from lib import *


class Hidato(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, len(puzzle.points) + 1))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        for p in sg.grid:
            sg.solver.add(Or(sg.grid[p] == 1, *[n.symbol == sg.grid[p] - 1 for n in sg.vertex_sharing_neighbors(p)]))
            sg.solver.add(Or(
                sg.grid[p] == len(puzzle.points),
                *[n.symbol == sg.grid[p] + 1 for n in sg.vertex_sharing_neighbors(p)]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
