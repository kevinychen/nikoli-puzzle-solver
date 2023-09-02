from lib import *


class Numberlink(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.texts) // 2))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False)

        # Ensure there are no extraneous separate loops
        for p in sg.grid:
            for q in sg.grid:
                sg.solver.add((sg.grid[p] == sg.grid[q]) == (rc.region_id_grid[p] == rc.region_id_grid[q]))

        for p in sg.grid:
            num_neighbors = Sum([n.symbol == sg.grid[p] for n in sg.edge_sharing_neighbors(p)])

            if p in puzzle.texts:
                # A number endpoint is orthogonally connected to one other square on the chain
                sg.solver.add(sg.grid[p] == puzzle.texts[p])
                sg.solver.add(num_neighbors == 1)
            else:
                # Every other square on the chain is orthogonally connected to two others
                sg.solver.add(Or(sg.grid[p] == 0, num_neighbors == 2))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            for n in sg.edge_sharing_neighbors(p):
                if solved_grid[p] != 0 and solved_grid[p] == solved_grid[n.location]:
                    solution.lines[p, n.location] = True
