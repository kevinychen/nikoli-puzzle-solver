from itertools import permutations
from math import atan2

from lib import *


class TapaLikeLoop(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice(border=True)
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        # Directions are in angle order. If a ring/donut is drawn around a region, then the "donut part" for a direction
        # is the loop shape at the region in that direction. For example, the square east of a number clue would have a
        # North-South segment.
        directions = sorted(lattice.vertex_sharing_directions(), key=lambda w: atan2(*w.vector))
        donut_parts = []
        for v in directions:
            v = lattice.opposite_direction(v)
            donut_parts.append(
                symbol_set.symbol_for_direction_pair(
                    *[
                        min(
                            lattice.edge_sharing_directions(),
                            key=lambda w: ((directions.index(w) - directions.index(v)) * sign - 1) % len(directions),
                        )
                        for sign in (-1, 1)
                    ]
                )
            )

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        for p in sg.grid.keys() - puzzle.points:
            sg.solver.add(sg.grid[p] == symbol_set.EMPTY)

        for p, text in puzzle.texts.items():
            # A square with numbers must be empty
            sg.solver.add(sg.grid[p] == symbol_set.EMPTY)

            # A square with numbers must have valid loop segments around it
            segment_lens = [int(c) for c in str(text)]
            choices = []
            for loop_entrances in permutations(range(len(directions)), len(segment_lens)):
                processed_squares = list()
                requirements = []
                for segment_len, loop_entrance in zip(segment_lens, loop_entrances):
                    for i in range(segment_len):
                        loop_dir = (loop_entrance + i) % len(directions)
                        square = p.translate(directions[loop_dir])
                        processed_squares.append(square)
                        requirements.append((sg.grid[square] == donut_parts[loop_dir]) == (0 < i < segment_len - 1))
                for square in lattice.vertex_sharing_points(p):
                    requirements.append((sg.grid[square] == symbol_set.EMPTY) != (square in processed_squares))
                if len(processed_squares) == len(set(processed_squares)):
                    choices.append(And(requirements))
            sg.solver.add(Or(choices))

        solved_grid, solution = solve(sg)
        solution.set_loop(sg, solved_grid)
