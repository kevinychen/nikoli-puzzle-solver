from itertools import permutations

from lib import *


class TapaLikeLoop(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        lattice = puzzle.lattice(border=True)
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append('EMPTY')
        # Corresponds to Directions.ALL: for example, the square east of a number would have a NS segment
        donut_parts = (symbol_set.NS, symbol_set.SW, symbol_set.EW, symbol_set.SE,
                       symbol_set.NS, symbol_set.NE, symbol_set.EW, symbol_set.NW)

        sg = init_symbol_grid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        for p in sg.grid:
            if p not in puzzle.points:
                sg.solver.add(sg.cell_is(p, symbol_set.EMPTY))

        for p, text in puzzle.texts.items():
            # A square with numbers must be empty
            sg.solver.add(sg.cell_is(p, symbol_set.EMPTY))

            # A square with numbers must have valid loop segments around it
            segment_lens = [int(c) for c in str(text)]
            choices = []
            for loop_entrances in permutations(range(8), len(segment_lens)):
                processed_squares = list()
                requirements = []
                for segment_len, loop_entrance in zip(segment_lens, loop_entrances):
                    for i in range(segment_len):
                        loop_dir = (loop_entrance + i) % 8
                        square = p.translate(Directions.ALL[loop_dir])
                        processed_squares.append(square)
                        requirements.append(sg.cell_is(square, donut_parts[loop_dir]) == (0 < i < segment_len - 1))
                for square in lattice.vertex_sharing_points(p):
                    requirements.append(sg.cell_is(square, symbol_set.EMPTY) != (square in processed_squares))
                if len(processed_squares) == len(set(processed_squares)):
                    choices.append(And(requirements))
            sg.solver.add(Or(choices))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_loop(sg, solved_grid)
