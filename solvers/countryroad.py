from lib import *


class CountryRoad(AbstractSolver):
    def run(self, puzzle, solve):
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])

        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        # Each number represents the number of squares visited in the region
        for (p, _), number in puzzle.edge_texts.items():
            sg.solver.add(Sum([sg.grid[q] != symbol_set.EMPTY for q in sg.grid if regions[p] == regions[q]]) == number)

        # Each region is visited once
        for region in puzzle.regions():
            exits = []
            for p in region:
                for n in sg.edge_sharing_neighbors(p):
                    if (p, n.location) in puzzle.borders:
                        exits.append((p, n.direction))
            sg.solver.add(Sum([sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)) for (p, v) in exits]) == 2)

        # No two unvisited cells in neighboring regions may be adjacent
        for p, q in puzzle.borders:
            sg.solver.add(Or(sg.grid.get(p) != symbol_set.EMPTY, sg.grid.get(q) != symbol_set.EMPTY))

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
