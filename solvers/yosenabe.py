from lib import *


class Yosenabe(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = PathSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        pc = PathConstrainer(sg, allow_loops=False)

        # All paths are straight
        straight_lines = [symbol_set.symbol_for_direction_pair(*v) for v in straight_edge_sharing_direction_pairs(sg)]
        for p in sg.grid:
            sg.solver.add(Or(Not(symbol_set.is_path_segment(sg.grid[p])), sg.cell_is_one_of(p, straight_lines)))

        # All paths start at a circle and can only end in a shaded area
        for p in sg.grid:
            sg.solver.add((p in puzzle.symbols) == (pc.path_order_grid[p] == 0))
            if p not in puzzle.symbols and p not in puzzle.shaded:
                sg.solver.add(Not(symbol_set.is_terminal(sg.grid[p])))

        # Create a grid where every cell on a path has the value of the starting circle
        values = {p: var() for p in sg.grid}
        for p in sg.grid:
            sg.solver.add(Implies(sg.grid[p] == symbol_set.EMPTY, values[p] == 0))
            if p in puzzle.symbols:
                sg.solver.add(values[p] == puzzle.texts[p])
            for v in sg.lattice.edge_sharing_directions():
                sg.solver.add(
                    Implies(
                        sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)),
                        values[p] == values.get(p.translate(v)),
                    )
                )

        # Each number not in a circle represents the sum of the moved white circles in the region
        uf = UnionFind()
        for p, q in puzzle.edges():
            if p in puzzle.shaded and q in puzzle.shaded:
                uf.union(p, q)
        for p, number in puzzle.texts.items():
            if p not in puzzle.symbols:
                region = [q for q in sg.grid if uf.find(p) == uf.find(q)]
                sg.solver.add(Sum([If(symbol_set.is_terminal(sg.grid[p]), values[q], 0) for q in region]) == number)

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
