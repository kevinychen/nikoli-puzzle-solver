from lib import *


class Tents(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False, min_region_size=2, max_region_size=2)

        # Each tree and its tent is a region of size 2; everything else must be EMPTY
        for p in sg.grid:
            is_tree = p in puzzle.symbols and puzzle.symbols[p] == Symbols.TREE
            if is_tree:
                sg.solver.add(rc.parent_grid[p] == R)
                sg.solver.add(sg.cell_is(p, 0))
            else:
                sg.solver.add(sg.cell_is(p, 0) == (rc.region_id_grid[p] == -1))

        # Satisfy tent counts
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.cell_is(q, 1) for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        no_adjacent_symbols(sg, 1, no_diagonal=True)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.symbols[p] = Symbols.TENT
