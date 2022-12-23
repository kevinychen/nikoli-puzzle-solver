from itertools import combinations

import grilops
from grilops import SymbolGrid, SymbolSet
from z3 import And, Implies, Or, Sum

from lib._lattices import LatticeType
from lib._utils import straight_edge_sharing_direction_pairs, var


class PathSymbolSet(SymbolSet):
    def __init__(self, lattice_type: LatticeType):
        super().__init__([])
        directions = lattice_type.edge_sharing_directions()
        self.dir_sets = [
            dir_set
            for size in range(len(directions) + 1)
            for dir_set in combinations(directions, size)
            if size <= 2 or all(lattice_type.opposite_direction(v) in dir_set for v in dir_set)
        ]
        for _ in self.dir_sets:
            self.append()


class PathConstrainer:
    def __init__(self, sg: SymbolGrid, loop=False):
        crossing_dir_pairs = straight_edge_sharing_direction_pairs(sg)

        # Since we support paths that cross, we need more than one grid with numbers from 1 to n. We need 2 grids for
        # the square grid case: at a non-crossing point, the numbers are the same, but at crossing points, one grid has
        # the number for when crossing horizontally, and th other grid has the number for when crossing vertically.
        # The hex grid case is analogous, but with 3 grids.
        self.loop = loop
        self.orders = [
            SymbolGrid(
                sg.lattice, grilops.make_number_range_symbol_set(-1, len(sg.grid) * len(crossing_dir_pairs)), sg.solver
            )
            for _ in crossing_dir_pairs
        ]
        self.is_crossing = SymbolGrid(sg.lattice, grilops.make_number_range_symbol_set(0, 1), sg.solver)
        self.path_len = var()

        # Single path from 1 to path_len
        sg.solver.add(Sum([Or([order.grid[p] == 1 for order in self.orders]) for p in sg.grid]) == 1)
        sg.solver.add(Sum([Or([order.grid[p] == self.path_len for order in self.orders]) for p in sg.grid]) == 1)
        for order in self.orders:
            for p in sg.grid:
                sg.solver.add(order.grid[p] != 0)
                sg.solver.add(order.grid[p] != self.path_len + 1)

        # If a loop, path_len must be next to 1
        if self.loop:
            sg.solver.add(
                Or(
                    [
                        And(order.grid[p] == self.path_len, order.grid[n.location] == 1)
                        for order in self.orders
                        for p in sg.grid
                        for n in sg.edge_sharing_neighbors(p)
                    ]
                )
            )

        # Ensure each cell has at most one higher neighbor, and exactly one lower neighbor (unless it's 1)
        for p in sg.grid:
            for (v, w), order in zip(crossing_dir_pairs, self.orders):
                sg.solver.add(
                    Implies(
                        self.is_crossing.grid[p] == 1,
                        Or(
                            order.grid[p] == -1,
                            And(
                                self.follows(order.grid, p.translate(v), p), self.follows(order.grid, p, p.translate(w))
                            ),
                            And(
                                self.follows(order.grid, p.translate(w), p), self.follows(order.grid, p, p.translate(v))
                            ),
                        ),
                    )
                )
                sg.solver.add(
                    Implies(
                        self.is_crossing.grid[p] == 1,
                        Or(
                            order.grid[p] == -1,
                            And(
                                Sum([self.follows(order.grid, p, q) for q in sg.lattice.edge_sharing_points(p)]) <= 1,
                                Or(
                                    order.grid[p] == 1 if not self.loop else False,
                                    Sum([self.follows(order.grid, q, p) for q in sg.lattice.edge_sharing_points(p)])
                                    == 1,
                                ),
                            ),
                        ),
                    )
                )
                sg.solver.add(Implies(self.is_crossing.grid[p] == 0, order.grid[p] == self.orders[0].grid[p]))

            sg.solver.add(
                Implies(
                    self.is_crossing.grid[p] == 0,
                    Or(
                        self.orders[0].grid[p] == -1,
                        And(
                            Sum([self.some_follows(p, n.location) for n in sg.edge_sharing_neighbors(p)]) <= 1,
                            Or(
                                self.orders[0].grid[p] == 1 if not self.loop else False,
                                Sum([self.some_follows(n.location, p) for n in sg.edge_sharing_neighbors(p)]) == 1,
                            ),
                        ),
                    ),
                )
            )

        # Map to direction sets in output grid
        for p in sg.grid:
            sg.solver.add(sg.grid[p] >= 0)
            sg.solver.add(sg.grid[p] < len(sg.symbol_set.dir_sets))
            for i, dir_set in enumerate(sg.symbol_set.dir_sets):
                sg.solver.add(
                    Implies(
                        sg.grid[p] == i,
                        And(
                            [
                                (p.translate(v) in sg.grid and self.some_adjacent(p, p.translate(v))) == (v in dir_set)
                                for v in sg.lattice.edge_sharing_directions()
                            ]
                        ),
                    )
                )

    def follows(self, grid, p, q):
        if p in grid and q in grid:
            if self.loop:
                return Or(grid[q] == grid[p] + 1, And(grid[q] == 1, grid[p] == self.path_len))
            return grid[q] == grid[p] + 1
        return False

    def some_follows(self, p, q):
        return Or([self.follows(order.grid, p, q) for order in self.orders])

    def some_adjacent(self, p, q):
        return Or(self.some_follows(p, q), self.some_follows(q, p))
