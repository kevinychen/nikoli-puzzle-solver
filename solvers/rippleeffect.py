from lib import *


class RippleEffect(AbstractSolver):
    def run(self, puzzle, solve):
        regions = puzzle.regions()

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, max(map(len, regions))))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        for region in regions:
            sg.solver.add(Distinct([sg.grid[p] for p in region]))
            for p in region:
                choices = []
                for i in range(1, len(region) + 1):
                    # if a square has number i, then none of the squares within distance i in any direction are i
                    choices.append(
                        And(
                            [
                                sg.grid[p] == i,
                                *[
                                    sg.grid[q] != i
                                    for v in sg.lattice.edge_sharing_directions()
                                    for q in sight_line(sg, p.translate(v), v)[:i]
                                ],
                            ]
                        )
                    )
                sg.solver.add(Or(choices))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
