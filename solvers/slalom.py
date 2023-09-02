from lib import *


class Slalom(AbstractSolver):
    def run(self, puzzle, solve):
        start = next(iter(puzzle.symbols))

        uf = UnionFind()
        for p, v in puzzle.walls:
            if (p.translate(v), puzzle.lattice_type.opposite_direction(v)) in puzzle.walls:
                uf.union(p, p.translate(v))
        wall_cells = set([p for p, _ in puzzle.walls if p in puzzle.points])
        gates = [[q for q in wall_cells if uf.find(q) == uf.find(p)] for p in wall_cells if uf.find(p) == p]

        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        sg.solver.add(lc.loop_order_grid[start] == 0)

        for p in puzzle.shaded:
            sg.solver.add(lc.inside_outside_grid[p] != L)

        # Pass through gates in correct order
        orders = [var() for _ in gates]
        if orders:
            sg.solver.add(orders[0] >= 0)
        for order1, order2 in zip(orders, orders[1:]):
            sg.solver.add(order1 < order2)

        straight_lines = [symbol_set.symbol_for_direction_pair(*v) for v in straight_edge_sharing_direction_pairs(sg)]
        for gate in gates:
            # Each gate is passed through exactly once, in a straight line, in some given order
            sg.solver.add(Sum([lc.inside_outside_grid[p] == L for p in gate]) == 1)
            for p in gate:
                sg.solver.add(Implies(lc.inside_outside_grid[p] == L, sg.cell_is_one_of(p, straight_lines)))
                sg.solver.add(
                    Implies(lc.inside_outside_grid[p] == L, Or([lc.loop_order_grid[p] == order for order in orders]))
                )

            # Numbers represent that the gate is passed through in a specific order
            for (p, _), number in puzzle.edge_texts.items():
                if p in gate:
                    sg.solver.add(Or([lc.loop_order_grid[q] == orders[number - 1] for q in gate]))

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
