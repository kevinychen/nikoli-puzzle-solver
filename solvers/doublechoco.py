from lib import *


class DoubleChoco(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in puzzle.shaded:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

        for p, q in puzzle.edges():
            if (p in puzzle.shaded) != (q in puzzle.shaded):
                sg.solver.add(rc.region_id_grid[p] != rc.region_id_grid[q])
            sg.solver.add(Implies(rc.region_id_grid[p] == rc.region_id_grid[q], sg.grid[p] == sg.grid[q]))

        # Each white half has a corresponding black half that may be rotated or reflected
        transforms = puzzle.lattice_type.transformation_functions(allow_rotations=True, allow_reflections=True)
        partners = {p: var() for p in sg.grid}
        transform_indices = {p: var() for p in sg.grid}
        for p in sg.grid:
            choices = []
            for q in sg.grid:
                if (p in puzzle.shaded) != (q in puzzle.shaded):
                    for i, transform in enumerate(transforms):
                        j, inv = next(
                            (j, inv)
                            for j, inv in enumerate(transforms)
                            if all(inv(transform(v.vector)) == v.vector for v in sg.lattice.edge_sharing_directions())
                        )
                        requirements = []
                        for v in sg.lattice.edge_sharing_directions():
                            new_p, new_q = p.translate(v), q.translate(transform(v.vector))
                            requirements.append(
                                Implies(
                                    rc.region_id_grid[p] == rc.region_id_grid.get(new_p),
                                    And(
                                        rc.region_id_grid[q] == rc.region_id_grid.get(new_q),
                                        partners.get(new_p) == sg.lattice.point_to_index(new_q),
                                        transform_indices.get(new_p) == i,
                                    ),
                                )
                            )
                        choices.append(
                            And(
                                partners[p] == sg.lattice.point_to_index(q),
                                partners[q] == sg.lattice.point_to_index(p),
                                transform_indices[p] == i,
                                transform_indices[q] == j,
                                *requirements,
                                sg.grid[p] == sg.grid[q],
                            )
                        )
            sg.solver.add(Or(choices))

        # White half and black half are connected
        trees = {p: var() for p in sg.grid}
        for p in sg.grid:
            sg.solver.add(trees[p] >= 1)
            sg.solver.add(
                Or(
                    And(sg.grid[p] == sg.lattice.point_to_index(p), trees[p] == 1),
                    *[
                        And(sg.grid[q] == sg.grid[p], trees[q] < trees[p])
                        for q in [n.location for n in sg.edge_sharing_neighbors(p)]
                    ],
                )
            )

        # The number represents the size of the (half) region
        for p, number in puzzle.texts.items():
            require_region_area(sg, p, lambda r: rc.region_id_grid[p] == rc.region_id_grid[r], number)

        # Ensure solution is unique
        for p in puzzle.shaded:
            sg.solver.add(sg.grid[p] >= sg.lattice.point_to_index(p))

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
