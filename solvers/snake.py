from lib import *


class Snake(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = PathSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        PathConstrainer(sg, allow_loops=False)

        # Satisfy snake square counts
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(
                    Sum([sg.grid[q] != symbol_set.EMPTY for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p]
                )

        for p in sg.grid:
            # Symbols represent the ends of the snake
            sg.solver.add(symbol_set.is_terminal(sg.grid[p]) == (p in puzzle.symbols))

            # A snake cell can only be adjacent to its neighboring cells
            sg.solver.add(
                Implies(
                    sg.grid[p] != symbol_set.EMPTY,
                    Sum([n.symbol != symbol_set.EMPTY for n in sg.edge_sharing_neighbors(p)]) <= 2,
                )
            )

            # Snake can't return to touch itself diagonally
            for diagonal in set(sg.vertex_sharing_neighbors(p)) - set(sg.edge_sharing_neighbors(p)):
                q = diagonal.location
                junction = next(j for j in junctions(sg) if p in j and q in j)
                sg.solver.add(
                    Implies(
                        And(sg.grid[p] != symbol_set.EMPTY, sg.grid[q] != symbol_set.EMPTY),
                        Or([sg.grid[r] != symbol_set.EMPTY for r in junction if r != p and r != q]),
                    )
                )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != symbol_set.EMPTY:
                solution.shaded[p] = True
