from lib import *


class Lighthouses(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == 0)

            # Each lighthouse shows the number of ships in the same line as the lighthouse
            sg.solver.add(
                Sum(
                    [
                        sg.grid[q]
                        for v in sg.lattice.edge_sharing_directions()
                        for q in sight_line(sg, p.translate(v), v)
                    ]
                )
                == number
            )

            # No ships can be next to lighthouses
            for n in sg.vertex_sharing_neighbors(p):
                sg.solver.add(n.symbol == 0)

        no_adjacent_symbols(sg, 1, no_diagonal=True)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.symbols[p] = Symbol(1, "battleship_B")
