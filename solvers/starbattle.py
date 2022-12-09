from solvers.utils import *


class StarBattle(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        num_stars = puzzle.parameters['stars']

        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, 1))

        for row in range(puzzle.height):
            sg.solver.add(Sum([sg.grid[Point(row, col)] for col in range(puzzle.width)]) == num_stars)
        for col in range(puzzle.width):
            sg.solver.add(Sum([sg.grid[Point(row, col)] for row in range(puzzle.height)]) == num_stars)
        for region in puzzle.to_regions(sg.lattice.points):
            sg.solver.add(Sum([sg.grid[p] for p in region]) == num_stars)

        no_adjacent_symbols(sg, 1, no_diagonal=True)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            solution.symbols[p] = Symbols.STAR if solved_grid[p] else Symbols.X
