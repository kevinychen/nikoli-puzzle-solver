from lib import *


class CastleWall(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        # find the region where the loop should be (not any of the small white regions with numbers)
        region = next(
            region
            for region in puzzle.regions()
            if any(p not in puzzle.shaded and p not in puzzle.texts for p in region)
        )

        sg = SymbolGrid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        for p in sg.grid:
            if p in puzzle.texts and p in puzzle.symbols:
                (v,) = puzzle.symbols[p].get_arrows()
                sg.solver.add(
                    Sum([sg.cell_is_one_of(q, symbol_set.symbols_for_direction(v)) for q in sight_line(sg, p, v)])
                    == puzzle.texts[p]
                )
            if p in puzzle.shaded:
                sg.solver.add(lc.inside_outside_grid[p] != L)
                if puzzle.shaded[p] in (1, 4):  # black
                    sg.solver.add(lc.inside_outside_grid[p] == O)
            elif p not in region:  # white
                sg.solver.add(lc.inside_outside_grid[p] == I)

        solved_grid, solution = solve(sg)
        solution.set_loop(sg, solved_grid)
