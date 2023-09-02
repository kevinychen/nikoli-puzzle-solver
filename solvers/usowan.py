from lib import *


class Usowan(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        lie = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1), sg.solver)

        for p in puzzle.texts:
            sg.solver.add(sg.grid[p] == 0)

        # Each region has a wrong number
        for region in puzzle.regions():
            sg.solver.add(Sum([lie.grid[q] for q in region if q in puzzle.texts]) == 1)

        # All other numbers represent the number of neighboring cells
        for p, number in puzzle.texts.items():
            sg.solver.add((lie.grid[p] == 0) == (Sum([n.symbol for n in sg.edge_sharing_neighbors(p)]) == number))

        require_continuous(sg, lambda q: sg.grid[q] == 0)
        no_adjacent_symbols(sg, 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
