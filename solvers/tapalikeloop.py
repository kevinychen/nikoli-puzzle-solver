from itertools import permutations

from solvers.utils import *


class TapaLikeLoop(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        directions = (Directions.E, Directions.NE, Directions.N, Directions.NW,
                      Directions.W, Directions.SW, Directions.S, Directions.SE)
        lattice = RectangularLattice(
            [Point(row, col) for row in range(-1, puzzle.height + 1) for col in range(-1, puzzle.width + 1)])
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append('empty')
        donut_parts = (symbol_set.NS, symbol_set.SW, symbol_set.EW, symbol_set.SE,
                       symbol_set.NS, symbol_set.NE, symbol_set.EW, symbol_set.NW)

        sg = init_symbol_grid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        for p in sg.grid:
            if not puzzle.in_bounds(p):
                sg.solver.add(sg.cell_is(p, symbol_set.empty))

        for p, text in puzzle.texts.items():
            # A square with numbers must be empty
            sg.solver.add(sg.cell_is(p, symbol_set.empty))

            # A square with numbers must have valid loop segments around it
            segment_lens = [int(c) for c in str(text)]
            choices = []
            for loop_entrances in permutations(range(8), len(segment_lens)):
                processed_squares = list()
                requirements = []
                for segment_len, loop_entrance in zip(segment_lens, loop_entrances):
                    for i in range(segment_len):
                        loop_dir = (loop_entrance + i) % 8
                        square = p.translate(directions[loop_dir])
                        processed_squares.append(square)
                        requirements.append(sg.cell_is(square, donut_parts[loop_dir]) == (0 < i < segment_len - 1))
                for square in lattice.vertex_sharing_points(p):
                    requirements.append(sg.cell_is(square, symbol_set.empty) != (square in processed_squares))
                if len(processed_squares) == len(set(processed_squares)):
                    choices.append(And(requirements))
            sg.solver.add(Or(choices))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_loop(sg, solved_grid)
