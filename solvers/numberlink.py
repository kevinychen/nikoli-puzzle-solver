from lib import *


class Numberlink(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.texts) // 2))

        for p in sg.grid:
            num_neighbors = Sum([n.symbol == sg.grid[p] for n in sg.edge_sharing_neighbors(p)])
            if p in puzzle.texts:
                # A number endpoint is orthogonally connected to one other square on the chain
                sg.solver.add(sg.cell_is(p, puzzle.texts[p]))
                sg.solver.add(num_neighbors == 1)
            else:
                # Every other square on the chain is orthogonally connected to two others
                sg.solver.add(Or(sg.cell_is(p, 0), num_neighbors == 2))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            for n in sg.edge_sharing_neighbors(p):
                if solved_grid[p] != 0 and solved_grid[p] == solved_grid[n.location]:
                    solution.lines[frozenset((p, n.location))] = True
