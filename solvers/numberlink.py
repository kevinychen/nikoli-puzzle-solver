from solvers.utils import *


class Numberlink(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        num_links = len(puzzle.texts) // 2

        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, num_links))

        for p in sg.grid:
            if p in puzzle.texts:
                # A number endpoint must be orthogonally connected to one other square on the chain
                sg.solver.add(sg.cell_is(p, int(puzzle.texts[p])))
                sg.solver.add(PbEq([(n.symbol == sg.grid[p], 1) for n in sg.edge_sharing_neighbors(p)], 1))
            else:
                # Every other square on the chain must be orthogonally connected to two others
                sg.solver.add(Or(
                    sg.cell_is(p, 0),
                    PbEq([(n.symbol == sg.grid[p], 1) for n in sg.edge_sharing_neighbors(p)], 2)))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            for v, lines in [(Directions.S, solution.vertical_lines), (Directions.E, solution.horizontal_lines)]:
                q = p.translate(v)
                if solved_grid[p] != 0 and q in solved_grid and solved_grid[p] == solved_grid[q]:
                    lines[p] = True
