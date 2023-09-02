from lib import *


class Sashigane(AbstractSolver):
    def run(self, puzzle, solve):
        shapes = [
            Shape([Vector(0, 0)] + [Vector(i + 1, 0) for i in range(a)] + [Vector(0, j + 1) for j in range(b)])
            for a in range(1, puzzle.height)
            for b in range(1, puzzle.width)
        ]

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))
        sc = ShapeConstrainer(sg.lattice, shapes, sg.solver, complete=True, allow_rotations=True, allow_copies=True)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == sc.shape_instance_grid[p])

        for p, symbol in puzzle.symbols.items():
            if symbol.is_circle():
                # Circles represent the corner of the L-shaped region
                for v in sg.lattice.edge_sharing_directions():
                    sg.solver.add(
                        (sc.shape_instance_grid[p] == sc.shape_instance_grid.get(p.translate(v)))
                        != (sc.shape_instance_grid[p] == sc.shape_instance_grid.get(p.translate(v.vector.negate())))
                    )

                # The number represents the area of the region
                if p in puzzle.texts:
                    sg.solver.add(
                        Or(
                            [
                                sc.shape_type_grid[p] == i
                                for i, shape in enumerate(shapes)
                                if len(shape.offset_vectors) == puzzle.texts[p]
                            ]
                        )
                    )
            else:
                # Arrows represent the end of a region
                (v,) = symbol.get_arrows()
                for w in sg.lattice.edge_sharing_directions():
                    sg.solver.add((sc.shape_instance_grid[p] == sc.shape_instance_grid.get(p.translate(w))) == (v == w))

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
