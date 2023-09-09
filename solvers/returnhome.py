from lib import *


class ReturnHomeKaero(AbstractSolver):
    def run(self, puzzle, solve):
        letters = list(set(puzzle.texts.values()))

        lattice = puzzle.lattice()
        symbol_set = PathSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        pc = PathConstrainer(sg, allow_loops=False)

        # All paths start at a letter
        for p in sg.grid:
            if p in puzzle.texts:
                sg.solver.add(Or(sg.grid[p] == symbol_set.EMPTY, pc.path_order_grid[p] == 0))
            else:
                sg.solver.add(Implies(symbol_set.is_terminal(sg.grid[p]), pc.path_order_grid[p] != 0))

        # Create a grid where every cell on a path has the value of the starting letter
        values = {p: var() for p in sg.grid}
        for p in sg.grid:
            if p in puzzle.texts:
                sg.solver.add(values[p] == letters.index(puzzle.texts[p]))
            else:
                sg.solver.add(Implies(sg.grid[p] == symbol_set.EMPTY, values[p] == -1))
            for v in sg.lattice.edge_sharing_directions():
                sg.solver.add(
                    Implies(
                        sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)),
                        values[p] == values.get(p.translate(v)),
                    )
                )

        # Every region has only one distinct letter
        for i, region in enumerate(puzzle.regions()):
            region_letter = var()
            for p in region:
                sg.solver.add(
                    Implies(
                        If(p in puzzle.texts, sg.grid[p] == symbol_set.EMPTY, symbol_set.is_terminal(sg.grid[p])),
                        values[p] == region_letter,
                    )
                )

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
