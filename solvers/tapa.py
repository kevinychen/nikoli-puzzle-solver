from itertools import groupby, product

from solvers.utils import *


class Tapa(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        directions = (Directions.E, Directions.NE, Directions.N, Directions.NW,
                      Directions.W, Directions.SW, Directions.S, Directions.SE)

        sg = init_symbol_grid(
            RectangularLattice(
                [Point(row, col) for row in range(-1, puzzle.height + 1) for col in range(-1, puzzle.width + 1)]),
            grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            if not (0 <= p.x < puzzle.width and 0 <= p.y < puzzle.height):
                # Add sentinel white squares around the grid, to avoid special-case logic for edges
                sg.solver.add(sg.cell_is(p, 0))

        for p, text in puzzle.texts.items():
            # A square with numbers must be white
            sg.solver.add(sg.cell_is(p, 0))

            # A square with numbers must have a valid coloring of its neighbors
            block_sizes = [int(c) for c in str(text)]
            choices = []
            for neighbor_colors in self._valid_neighbor_colors(block_sizes):
                choices.append(And([sg.cell_is(p.translate(v), neighbor_colors[i]) for i, v in enumerate(directions)]))
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
