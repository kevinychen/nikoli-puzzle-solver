from lib import *


class Battleships(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        lengths = [int(c) for c in puzzle.parameters['lengths']]
        shapes = [Shape([Vector(i, 0) for i in range(length)]) for length in lengths]

        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, 6))
        sc = ShapeConstrainer(sg.lattice, shapes, sg.solver, allow_rotations=True)

        # Satisfy ship counts
        for p, v in puzzle.border_lines(Directions.E, Directions.S):
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] > 0 for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        # Satisfy given ship parts/water
        for p, symbol in puzzle.symbols.items():
            if symbol.shape.startswith('battleship_'):
                sg.solver.add(sg.cell_is(p, symbol.style % 7))

        # Restrictions for each ship part
        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 0) == (sc.shape_type_grid[p] == -1))
            # single ship
            sg.solver.add(Implies(sg.cell_is(p, 1), And([ship.symbol == 0 for ship in sg.edge_sharing_neighbors(p)])))
            # ship middle
            sg.solver.add(Implies(sg.cell_is(p, 2), Or(
                And([sg.grid.get(p.translate(v), 0) > 0 for v in (Directions.E, Directions.W)]),
                And([sg.grid.get(p.translate(v), 0) > 0 for v in (Directions.N, Directions.S)]))))
            # ship ends
            for num, v in (3, Directions.W), (4, Directions.N), (5, Directions.E), (6, Directions.S):
                sg.solver.add(Implies(sg.cell_is(p, num), And(
                    sg.grid.get(p.translate(v.vector.negate()), 0) > 0, sg.grid.get(p.translate(v), 0) == 0)))

        # No two ships may be adjacent
        for p in sg.grid:
            for ship, shape_instance in \
                    zip(sg.vertex_sharing_neighbors(p), sg.lattice.vertex_sharing_neighbors(sc.shape_instance_grid, p)):
                sg.solver.add(
                    Implies(And(sg.grid[p] > 0, ship.symbol > 0), sc.shape_instance_grid[p] == shape_instance.symbol))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.symbols[p] = Symbol(solved_grid[p], 'battleship_B') if solved_grid[p] else Symbols.WATER
