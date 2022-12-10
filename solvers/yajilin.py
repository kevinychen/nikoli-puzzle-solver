from lib import *


class Yajilin(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        directions = (Directions.E, Directions.S, Directions.W, Directions.N,
                      Directions.W, Directions.N, Directions.E, Directions.S)
        lattice = grilops.get_rectangle_lattice(puzzle.height, puzzle.width)
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append('BLACK')
        symbol_set.append('WALL')

        sg = init_symbol_grid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        for p in sg.grid:
            if p in puzzle.texts and p in puzzle.symbols and puzzle.symbols[p].shape == 'arrow_fouredge_B':
                sg.solver.add(sg.cell_is(p, symbol_set.WALL))
                for direction in [i for i, flag in enumerate(puzzle.symbols[p].style) if flag]:
                    sg.solver.add(
                        Sum([sg.cell_is(q, symbol_set.BLACK) for q in sight_line(sg, p, directions[direction])])
                        == puzzle.texts[p])
            elif p in puzzle.shaded:
                sg.solver.add(sg.cell_is(p, symbol_set.WALL))
            else:
                sg.solver.add(Not(sg.cell_is(p, symbol_set.WALL)))

            no_adjacent_symbols(sg, symbol_set.BLACK)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_loop(sg, solved_grid)
        for p in sg.grid:
            if solved_grid[p] == sg.symbol_set.BLACK:
                solution.shaded[p] = True
