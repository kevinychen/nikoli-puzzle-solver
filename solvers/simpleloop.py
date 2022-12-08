from solvers.utils import *


class SimpleLoop(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        lattice = grilops.get_rectangle_lattice(puzzle.height, puzzle.width)
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append('black')

        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)
        for p in sg.lattice.points:
            sg.solver.add((lc.inside_outside_grid[p] == L) == (p not in puzzle.shaded))

        # Optimization: loop starts at one of the empty squares
        sg.solver.add(lc.loop_order_grid[next(p for p in sg.lattice.points if p not in puzzle.shaded)] == 0)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_loop(sg, solved_grid)
