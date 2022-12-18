from lib import *


class IceBarn(AbstractSolver):
    def run(self, puzzle, solve):
        # Since we support paths that cross, we need more than one grid with numbers from 1 to n. We need 2 grids for
        # the square grid case: at a non-crossing point, the numbers are the same, but at crossing points, one grid has
        # the number for when crossing horizontally, and th other grid has the number for when crossing vertically.
        # The hex grid case is analogous, but with 3 grids.
        crossing_dir_pairs = puzzle.lattice_type.straight_edge_sharing_direction_pairs()
        shifts = [lambda r, i=i: Point(r.y + (puzzle.height + 1) * i, r.x) for i in range(len(crossing_dir_pairs))]

        sg = SymbolGrid(
            puzzle.lattice_type.factory([shift(p) for p in puzzle.points for shift in shifts]),
            grilops.make_number_range_symbol_set(-1, len(puzzle.points) * len(shifts)),
        )

        # One start location
        sg.solver.add(Sum([sg.grid[p] == 1 for p in puzzle.points]) == 1)
        for p in sg.grid:
            sg.solver.add(sg.grid[p] != 0)

        for p in puzzle.points:
            for (v, w), shift in zip(crossing_dir_pairs, shifts):
                if p in puzzle.shaded:
                    # On ice, the path must go in a straight line
                    sg.solver.add(
                        Or(
                            sg.grid[shift(p)] == -1,
                            And(
                                sg.grid.get(shift(p).translate(v)) == sg.grid[shift(p)] - 1,
                                sg.grid.get(shift(p).translate(w)) == sg.grid[shift(p)] + 1,
                            ),
                            And(
                                sg.grid.get(shift(p).translate(v)) == sg.grid[shift(p)] + 1,
                                sg.grid.get(shift(p).translate(w)) == sg.grid[shift(p)] - 1,
                            ),
                        )
                    )
                else:
                    # On not ice, the numbers must be the same across all grids
                    sg.solver.add(sg.grid[shift(p)] == sg.grid[p])

                # Each number other than 1 has exactly one number before it
                sg.solver.add(
                    Or(
                        sg.grid[shift(p)] == -1,
                        sg.grid[shift(p)] == 1,
                        Sum(
                            [
                                Or(
                                    [
                                        sg.grid[other_shift(n.location)] == sg.grid[shift(p)] - 1
                                        for other_shift in shifts
                                    ]
                                )
                                for n in sg.edge_sharing_neighbors(p)
                            ]
                        )
                        == 1,
                    )
                )
                # Each number has at most one number after it
                sg.solver.add(
                    Sum(
                        [
                            Or([sg.grid[other_shift(n.location)] == sg.grid[shift(p)] + 1 for other_shift in shifts])
                            for n in sg.edge_sharing_neighbors(p)
                        ]
                    )
                    <= 1
                )

        # Follow given arrows
        for (p, q, *_), symbol in puzzle.junctions.items():
            if type(symbol) is Symbol:
                (v,) = symbol.get_arrows()
                if v is not None:
                    start, end = (p, q) if p.translate(v) == q else (q, p)
                    if start not in puzzle.points:
                        sg.solver.add(sg.grid[end] == 1)
                    elif end not in puzzle.points:
                        sg.solver.add(And([sg.grid[r] <= sg.grid[start] for r in sg.grid]))
                    else:
                        sg.solver.add(Or([sg.grid[shift(end)] == sg.grid[shift(start)] + 1 for shift in shifts]))

        # All ice regions must be reached
        uf = UnionFind()
        for p, q in puzzle.edges():
            if p in puzzle.shaded and q in puzzle.shaded:
                uf.union(p, q)
        for p in puzzle.shaded:
            sg.solver.add(
                Or([sg.grid[shift(q)] != -1 for q in puzzle.shaded if uf.find(p) == uf.find(q) for shift in shifts])
            )

        solved_grid, solution = solve(sg)
        for p in puzzle.points:
            for shift in shifts:
                for n in sg.edge_sharing_neighbors(p):
                    if solved_grid[shift(n.location)] == solved_grid[shift(p)] + 1:
                        solution.lines[frozenset((p, p.translate(n.direction)))] = True
