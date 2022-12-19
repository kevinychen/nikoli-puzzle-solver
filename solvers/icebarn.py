from lib import *


class IceBarn(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), PathSymbolSet(puzzle.lattice_type))
        pc = PathConstrainer(sg)

        # Can only cross on ice
        for p in puzzle.points:
            sg.solver.add(pc.is_crossing.grid[p] == (p in puzzle.shaded))

        # Follow given arrows
        for (p, q, *_), symbol in puzzle.junction_symbols.items():
            (v,) = symbol.get_arrows()
            if v is not None:
                start, end = (p, q) if p.translate(v) == q else (q, p)
                if start not in puzzle.points:
                    sg.solver.add(pc.orders[0].grid[end] == 1)
                elif end not in puzzle.points:
                    sg.solver.add(And([pc.orders[0].grid[r] <= pc.orders[0].grid[start] for r in sg.grid]))
                else:
                    sg.solver.add(Or([order.grid[end] == order.grid[start] + 1 for order in pc.orders]))

        # All ice regions must be reached
        uf = UnionFind()
        for p, q in puzzle.edges():
            if p in puzzle.shaded and q in puzzle.shaded:
                uf.union(p, q)
        for p in puzzle.shaded:
            sg.solver.add(
                Or([order.grid[q] != -1 for q in puzzle.shaded if uf.find(p) == uf.find(q) for order in pc.orders])
            )

        solved_grid, solution = solve(sg)
        for p in puzzle.points:
            for v in sg.symbol_set.dir_sets[solved_grid[p]]:
                solution.lines[p, p.translate(v)] = True
