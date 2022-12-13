from lib import *


class Kropki(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.get_lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for p in sg.grid:
            for n in sg.edge_sharing_neighbors(p):
                q = n.location
                white_condition = Or(sg.grid[p] == sg.grid[q] + 1, sg.grid[p] + 1 == sg.grid[q])
                black_condition = Or(sg.grid[p] == sg.grid[q] * 2, sg.grid[p] * 2 == sg.grid[q])
                if frozenset((p, q)) in puzzle.junctions:
                    sg.solver.add(
                        black_condition if puzzle.junctions[frozenset((p, q))].is_black() else white_condition)
                else:
                    sg.solver.add(Not(Or(white_condition, black_condition)))

        distinct_rows_and_columns(sg)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            solution.texts[p] = solved_grid[p]
