from solvers.utils import *


class CastleWall(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        directions = [Directions.E, Directions.S, Directions.W, Directions.N,
                      Directions.W, Directions.N, Directions.E, Directions.S]
        lattice = grilops.get_rectangle_lattice(puzzle.height, puzzle.width)
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append('empty')

        sg = init_symbol_grid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        # find the region where the loop should be
        region = next(region for region in puzzle.to_regions(sg.lattice.points)
                      if all(p in puzzle.shaded or p not in puzzle.texts for p in region))

        for p in sg.grid:
            if p in puzzle.texts and p in puzzle.symbols and puzzle.symbols[p].shape == 'arrow_fouredge_B':
                for direction in [i for i, flag in enumerate(puzzle.symbols[p].style) if flag]:
                    v = directions[direction]
                    allowed_loop_symbols = [s.index for s in symbol_set.symbols.values() if v.name in s.name]
                    sg.solver.add(Sum([sg.cell_is_one_of(q, allowed_loop_symbols) for q in sight_line(sg, p, v)])
                                  == puzzle.texts[p])
            if p not in region:
                sg.solver.add(lc.inside_outside_grid[p] == I)
            if p in puzzle.shaded:
                sg.solver.add(lc.inside_outside_grid[p] != L)
                if puzzle.shaded[p] in (1, 4):  # black
                    sg.solver.add(lc.inside_outside_grid[p] == O)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_loop(sg, solved_grid)
