from lib import *


class MaxiLoop(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        # Each number represents the maximum length of a loop segment through the region
        loop_direction = require_loop_direction(sg)
        for (p, _), number in puzzle.edge_texts.items():
            region = next(region for region in puzzle.regions() if p in region)
            if number > len(region):
                sg.solver.add(False)
                break

            max_length = {p: var() for p in region}
            for q in region:
                sg.solver.add(max_length[q] == 1)
            for i in range(number):
                if i == number - 1:
                    sg.solver.add(Or([max_length[p] == 1 for p in region]))
                new_max_length = {p: var() for p in region}
                for q in region:
                    sg.solver.add(
                        new_max_length[q]
                        == Or(
                            [
                                And(loop_direction[q] == v, max_length.get(q.translate(v)) == 1)
                                for v in sg.lattice.edge_sharing_directions()
                            ]
                        )
                    )
                max_length = new_max_length
                if i == number - 1:
                    sg.solver.add(And([max_length[p] == 0 for p in region]))

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
