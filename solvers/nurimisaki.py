from lib import *


class Nurimisaki(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Every circle represents a dead end. A number represents the sight line from that dead end.
        for p in sg.grid:
            dead_end = And(sg.grid[p] == 0, Sum([n.symbol == 0 for n in sg.edge_sharing_neighbors(p)]) == 1)
            if p in puzzle.symbols:
                sg.solver.add(dead_end)
                if p in puzzle.texts:
                    require_sight_line_count(sg, p, lambda q: sg.grid[q] == 0, puzzle.texts[p])
            else:
                sg.solver.add(Not(dead_end))

        require_continuous(sg, lambda q: sg.grid[q] == 0)
        for i in range(2):
            no2x2(sg, lambda q: sg.grid[q] == i)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
