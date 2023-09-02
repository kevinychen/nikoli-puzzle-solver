from itertools import groupby, product
from math import atan2

from lib import *


class Tapa(AbstractSolver):
    def run(self, puzzle, solve):
        directions = sorted(puzzle.lattice_type.vertex_sharing_directions(), key=lambda v: atan2(*v.vector))

        sg = SymbolGrid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, 1))

        for p in sg.grid.keys() - puzzle.points:
            sg.solver.add(sg.grid[p] == 0)

        for p, text in puzzle.texts.items():
            # A square with numbers must be white
            sg.solver.add(sg.grid[p] == 0)

            # A square with numbers must have a valid coloring of its neighbors
            block_sizes = [int(c) for c in str(text)]
            choices = []
            for neighbor_colors in self._valid_neighbor_colors(block_sizes, len(directions)):
                choices.append(And([sg.grid[p.translate(v)] == neighbor_colors[i] for i, v in enumerate(directions)]))
            sg.solver.add(Or(choices))

        require_continuous(sg, lambda q: sg.grid[q] == 1)
        no2x2(sg, lambda q: sg.grid[q] == 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True

    @staticmethod
    def _valid_neighbor_colors(desired_block_sizes, num_neighbors):
        # Get all tuples of valid colorings of a region's neighbors.
        if desired_block_sizes == [num_neighbors]:
            return [[1] * num_neighbors]
        valid_neighbor_colors = set()
        for colors in product(*[[0, 1]] * (num_neighbors - 1) + [[0]]):
            block_sizes = [len(list(g)) for k, g in groupby(colors) if k == 1]
            if sorted(block_sizes) == sorted(desired_block_sizes):
                for rotation in range(num_neighbors):
                    valid_neighbor_colors.add(colors[rotation:] + colors[:rotation])
        return valid_neighbor_colors
