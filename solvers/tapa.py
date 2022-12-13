from itertools import groupby, product

from lib import *


class Tapa(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.get_lattice(border=True), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if p not in puzzle.points:
                sg.solver.add(sg.cell_is(p, 0))

        for p, text in puzzle.texts.items():
            # A square with numbers must be white
            sg.solver.add(sg.cell_is(p, 0))

            # A square with numbers must have a valid coloring of its neighbors
            block_sizes = [int(c) for c in str(text)]
            choices = []
            for neighbor_colors in self._valid_neighbor_colors(block_sizes):
                choices.append(
                    And([sg.cell_is(p.translate(v), neighbor_colors[i]) for i, v in enumerate(Directions.ALL)]))
            sg.solver.add(Or(choices))

        continuous_region(sg, rc, lambda q: sg.cell_is(q, 1))
        no2x2(sg, 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True

    @staticmethod
    def _valid_neighbor_colors(desired_block_sizes):
        # Get all 8-tuples of valid colorings of a square's 8 neighbors.
        if desired_block_sizes == [8]:
            return [[1] * 8]
        valid_neighbor_colors = set()
        for colors in product(*[[0, 1]] * 7 + [[0]]):
            block_sizes = [len(list(g)) for k, g in groupby(colors) if k == 1]
            if sorted(block_sizes) == sorted(desired_block_sizes):
                for rotation in range(8):
                    valid_neighbor_colors.add(colors[rotation:] + colors[:rotation])
        return valid_neighbor_colors
