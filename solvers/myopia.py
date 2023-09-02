from lib import *


class Myopia(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(border=True), grilops.make_number_range_symbol_set(0, 1))

        for p in sg.grid.keys() - puzzle.points:
            sg.solver.add(sg.grid[p] == 0)

        for p, symbol in puzzle.symbols.items():
            # Arrows point to the closest square in the other region
            arrows = symbol.get_arrows()
            if arrows:
                lines = [(v, sight_line(sg, p.translate(v), v)) for v in sg.lattice.edge_sharing_directions()]
                choices = []
                for i in range(min(len(line) for v, line in lines if v in arrows)):
                    choices.append(
                        And(
                            [
                                *[
                                    sg.grid[q] == sg.grid[p]
                                    for v, line in lines
                                    for q in line[: (i if v in arrows else i + 1)]
                                ],
                                *[sg.grid[line[i]] != sg.grid[p] for v, line in lines if v in arrows],
                            ]
                        )
                    )
                sg.solver.add(Or(choices))

        for i in range(2):
            require_continuous(sg, lambda q: sg.grid[q] == i)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
