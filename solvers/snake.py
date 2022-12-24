from lib import *


class Snake(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Satisfy snake square counts
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        for p in sg.grid:
            num_neighbors = Sum([n.symbol for n in sg.edge_sharing_neighbors(p)])
            if p in puzzle.symbols and puzzle.symbols[p].is_circle():
                # A snake end is only orthogonally adjacent to one other snake square
                sg.solver.add(sg.grid[p] == 1)
                sg.solver.add(num_neighbors == 1)
            else:
                # Every other snake square is orthogonally adjacent to two others
                sg.solver.add(Or(sg.grid[p] == 0, num_neighbors == 2))

            # Snake can't return to touch itself diagonally
            for q, intermediates in diagonal_neighbors(sg, p):
                sg.solver.add(
                    Implies(And(sg.grid[p] == 1, sg.grid[q] == 1), Or([sg.grid[r] == 1 for r in intermediates]))
                )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
