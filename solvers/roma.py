from lib import *


class Roma(AbstractSolver):
    def run(self, puzzle, solve):
        directions = puzzle.lattice_type.edge_sharing_directions()

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(-1, len(directions) - 1))

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == -1) == (p in puzzle.symbols and puzzle.symbols[p].is_circle()))

        # Each region contains distinct arrows
        for region in puzzle.regions():
            sg.solver.add(Distinct([sg.grid[p] for p in region]))

        # Every cell can reach the goal circle by following arrows
        tree = {p: var() for p in sg.grid}
        for p in sg.grid:
            for i, v in enumerate(directions):
                sg.solver.add(
                    Implies(sg.grid[p] == i, tree[p] < tree.get(p.translate(v)) if p.translate(v) in tree else False)
                )

        # Given arrows are correct
        for p, symbol in puzzle.symbols.items():
            if not symbol.is_circle():
                (v,) = symbol.get_arrows()
                sg.solver.add(sg.grid[p] == directions.index(v))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.symbols[p] = Symbol.from_arrow("arrow_N_G", directions[solved_grid[p]])
