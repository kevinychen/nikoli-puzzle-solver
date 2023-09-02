from lib import *


class Clouds(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        for p in sg.grid:
            # All clouds are rectangles that don't touch
            diagonals = set(sg.vertex_sharing_neighbors(p)) - set(sg.edge_sharing_neighbors(p))
            for diagonal in diagonals:
                q = diagonal.location
                junction = next(j for j in junctions(sg) if p in j and q in j)
                sg.solver.add(Implies(And(sg.grid[p] == 1, sg.grid[q] == 1), And([sg.grid[r] == 1 for r in junction])))

            # Clouds must be at least 2 cells wide and 2 cells long
            sg.solver.add(Implies(sg.grid[p] == 1, Or([diagonal.symbol == 1 for diagonal in diagonals])))

        # Each number represents the number of cloud cells in the line
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
