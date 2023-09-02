from collections import defaultdict

from lib import *


class MoonOrSun(AbstractSolver):
    def run(self, puzzle, solve):
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])
        symbols = list(set(symbol for symbol in puzzle.symbols.values()))
        assert len(symbols) == 2

        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        # In a sun region, all suns and no moons must be crossed (and similarly for moon regions)
        which_symbols = [var() for _ in puzzle.regions()]
        for which_symbol in which_symbols:
            sg.solver.add(Or(which_symbol == 0, which_symbol == 1))
        for p, symbol in puzzle.symbols.items():
            sg.solver.add((sg.grid[p] != symbol_set.EMPTY) == (which_symbols[regions[p]] == symbols.index(symbol)))

        # Regions alternate between sun and moon
        for p, q in puzzle.borders:
            if p in sg.grid and q in sg.grid:
                v = next(v for v in sg.lattice.edge_sharing_directions() if p.translate(v) == q)
                sg.solver.add(
                    Implies(
                        sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)),
                        which_symbols[regions[p]] != which_symbols[regions[q]],
                    )
                )

        # Each region is visited once
        region_exits = defaultdict(list)
        for p in sg.grid:
            for n in sg.edge_sharing_neighbors(p):
                if regions[p] != regions[n.location]:
                    region_exits[regions[p]].append((p, n.direction))
        for region, exits in region_exits.items():
            sg.solver.add(Sum([sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)) for (p, v) in exits]) == 2)

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
