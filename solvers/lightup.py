from lib import *


class LightUpAkari(AbstractSolver):
    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, number in puzzle.texts.items():
            sg.solver.add(Sum([n.symbol for n in sg.edge_sharing_neighbors(p)]) == number)

        for p in sg.grid:
            if p in puzzle.shaded:
                sg.solver.add(sg.grid[p] == 0)
            else:
                lines = []
                for n in sg.edge_sharing_neighbors(p):
                    lines.extend(
                        sight_line(sg, n.location, n.direction, lambda q: q in sg.grid and q not in puzzle.shaded)
                    )
                sg.solver.add(Implies(sg.grid[p] == 1, And([sg.grid[q] == 0 for q in lines])))
                sg.solver.add(Implies(sg.grid[p] == 0, Or([sg.grid[q] == 1 for q in lines])))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.symbols[p] = Symbols.LIGHT_BULB
