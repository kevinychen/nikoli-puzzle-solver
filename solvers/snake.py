from lib import *


class Snake(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, 1))

        # Satisfy snake square counts
        for p, v in puzzle.border_lines(Directions.E, Directions.S):
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        for p in sg.grid:
            num_neighbors = Sum([n.symbol for n in sg.edge_sharing_neighbors(p)])
            if p in puzzle.symbols and puzzle.symbols[p].is_circle():
                # A snake end is only orthogonally adjacent to one other snake square
                sg.solver.add(sg.cell_is(p, 1))
                sg.solver.add(num_neighbors == 1)
            else:
                # Every other snake square is orthogonally adjacent to two others
                sg.solver.add(Or(sg.cell_is(p, 0), num_neighbors == 2))

            # Snake can't touch itself diagonally
            for n in sg.vertex_sharing_neighbors(p):
                if n not in sg.edge_sharing_neighbors(p):
                    sg.solver.add(Implies(
                        And(sg.cell_is(p, 1), n.symbol == 1),
                        Or(sg.cell_is(Point(p.y, n.location.x), 1), sg.cell_is(Point(n.location.y, p.x), 1))))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
