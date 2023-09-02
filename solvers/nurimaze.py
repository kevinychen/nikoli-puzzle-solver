from collections import defaultdict

from lib import *


class Nurimaze(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Each region must be all white or all black
        for region in puzzle.regions():
            sg.solver.add(And([sg.grid[p] == sg.grid[region[0]] for p in region]))

        # All white squares form a tree
        tree = SymbolGrid(sg.lattice, grilops.make_number_range_symbol_set(0, len(puzzle.points)), sg.solver)
        sg.solver.add(Sum([tree.grid[q] == 1 for q in sg.grid]) == 1)
        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 0) == (tree.grid[p] >= 1))
            for n in tree.edge_sharing_neighbors(p):
                sg.solver.add(Or(tree.grid[p] == 0, n.symbol != tree.grid[p]))
            sg.solver.add(
                Or(
                    tree.grid[p] <= 1,
                    Sum([And(n.symbol != 0, n.symbol < tree.grid[p]) for n in tree.edge_sharing_neighbors(p)]) == 1,
                )
            )

        # Find a path through white squares that goes from S to G
        path = SymbolGrid(sg.lattice, grilops.make_number_range_symbol_set(0, 1), sg.solver)
        for p in sg.grid:
            sg.solver.add(Implies(path.grid[p] == 1, sg.grid[p] == 0))

            if p not in puzzle.texts:
                sg.solver.add(Implies(path.grid[p] == 1, Sum([n.symbol for n in path.edge_sharing_neighbors(p)]) == 2))

        # Path must go through all circles but not go through any triangles
        for p, symbol in puzzle.symbols.items():
            sg.solver.add(sg.grid[p] == 0)
            sg.solver.add((path.grid[p] == 1) == symbol.is_circle())

        for i in range(2):
            no2x2(sg, lambda q: sg.grid[q] == i)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
