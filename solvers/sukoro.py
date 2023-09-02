from lib import *


class Sukoro(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        sg = SymbolGrid(lattice, grilops.make_number_range_symbol_set(0, len(lattice.edge_sharing_directions())))

        # Each number represents the number of neighbors with numbers
        for p in sg.grid:
            sg.solver.add(
                Implies(sg.grid[p] != 0, Sum([n.symbol != 0 for n in sg.edge_sharing_neighbors(p)]) == sg.grid[p])
            )

        # Two of the same number may not be adjacent
        for i in range(1, len(lattice.edge_sharing_directions())):
            no_adjacent_symbols(sg, i)

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        require_continuous(sg, lambda r: sg.grid[r] != 0)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.texts and solved_grid[p] != 0:
                solution.texts[p] = solved_grid[p]
