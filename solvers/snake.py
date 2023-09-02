from lib import *


class Snake(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), PathSymbolSet(puzzle.lattice_type))
        PathConstrainer(sg)

        # Satisfy snake square counts
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] != 0 for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        for p in sg.grid:
            num_neighbors = Sum([n.symbol != 0 for n in sg.edge_sharing_neighbors(p)])
            if p in puzzle.symbols and puzzle.symbols[p].is_circle():
                # A snake end is only orthogonally adjacent to one other snake square
                sg.solver.add(sg.grid[p] != 0)
                sg.solver.add(num_neighbors == 1)
            else:
                # Every other snake square is orthogonally adjacent to two others
                sg.solver.add(Or(sg.grid[p] == 0, num_neighbors <= 2))

            # Snake can't return to touch itself diagonally
            for diagonal in set(sg.vertex_sharing_neighbors(p)) - set(sg.edge_sharing_neighbors(p)):
                q = diagonal.location
                junction = next(j for j in junctions(sg) if p in j and q in j)
                sg.solver.add(
                    Implies(
                        And(sg.grid[p] != 0, sg.grid[q] != 0),
                        Or([sg.grid[r] != 0 for r in junction if r != p and r != q]),
                    )
                )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
