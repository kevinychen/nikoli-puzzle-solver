from lib import *


class Pentopia(AbstractSolver):
    def run(self, puzzle, solve):
        shapes = puzzle.polyominoes(5)

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))
        sc = ShapeConstrainer(
            sg.lattice, shapes, sg.solver, allow_rotations=True, allow_reflections=True, allow_copies=True
        )

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == (sc.shape_type_grid[p] != -1))

        for p, symbol in puzzle.symbols.items():
            sg.solver.add(sg.grid[p] == 0)

            # Arrows point to the closest pieces
            arrows = symbol.get_arrows()
            if arrows:
                lines = [(v, sight_line(sg, p.translate(v), v)) for v in sg.lattice.edge_sharing_directions()]
                choices = []
                for i in range(min([len(line) for v, line in lines if v in arrows])):
                    choices.append(
                        And(
                            [
                                *[sg.grid[p] == 0 for v, line in lines for p in line[: (i if v in arrows else i + 1)]],
                                *[sg.grid[line[i]] == 1 for v, line in lines if v in arrows],
                            ]
                        )
                    )
                sg.solver.add(Or(choices))

        # At most one of each piece
        for i, shape in enumerate(shapes):
            sg.solver.add(Sum([sc.shape_type_grid[p] == i for p in sg.grid]) <= len(shape.offset_vectors))

        # No two pieces may touch
        for p, q in puzzle.edges(include_diagonal=True):
            sg.solver.add(
                Implies(And(sg.grid[p] == 1, sg.grid[q] == 1), sc.shape_instance_grid[p] == sc.shape_instance_grid[q])
            )

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
