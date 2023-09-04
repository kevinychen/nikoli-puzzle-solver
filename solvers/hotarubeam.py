from lib import *


class HotaruBeam(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = grilops.get_rectangle_lattice(puzzle.height + 1, puzzle.width + 1)
        symbol_set = PathSymbolSet(lattice, include_terminals=False)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)

        # Fireflies are placed on vertices in this puzzle, but we want to consider them in cells
        texts = {sorted(junction)[3]: text for junction, text in puzzle.junction_texts.items()}
        symbols = {sorted(junction)[3]: symbol for junction, symbol in puzzle.junction_symbols.items()}
        fireflies = {p: firefly.get_arrows()[0] for p, firefly in symbols.items()}

        # Path symbols are consistent, other than at fireflies
        for p in sg.grid:
            sg.solver.add(Implies(p in symbols, sg.grid[p] == symbol_set.EMPTY))
            for v in sg.lattice.edge_sharing_directions():
                q = p.translate(v)
                w = sg.lattice.opposite_direction(v)
                if q not in symbols:
                    sg.solver.add(
                        Implies(
                            sg.cell_is_one_of(p, symbol_set.symbols_for_direction(v)),
                            sg.cell_is_one_of(q, symbol_set.symbols_for_direction(w)) if q in sg.grid else False,
                        )
                    )

        # Each path starts from a firefly with a given initial direction
        for p, v in fireflies.items():
            sg.solver.add(
                sg.cell_is_one_of(p.translate(v), symbol_set.symbols_for_direction(sg.lattice.opposite_direction(v)))
            )

        # The number on the firefly represents the number of turns on its path
        path_instances = {p: var() for p in sg.grid}
        for i, (p, v) in enumerate(fireflies.items()):
            sg.solver.add(path_instances[p.translate(v)] == i)
        for p in sg.grid:
            sg.solver.add(Implies(sg.grid[p] == symbol_set.EMPTY, path_instances[p] == -1))
            for n in sg.edge_sharing_neighbors(p):
                if p not in symbols and n.location not in symbols:
                    sg.solver.add(
                        Implies(
                            sg.cell_is_one_of(p, symbol_set.symbols_for_direction(n.direction)),
                            path_instances[p] == path_instances[n.location],
                        )
                    )
        straight_lines = [symbol_set.symbol_for_direction_pair(*v) for v in straight_edge_sharing_direction_pairs(sg)]
        for i, p in enumerate(fireflies):
            if p in texts:
                sg.solver.add(
                    Sum([And(path_instances[q] == i, Not(sg.cell_is_one_of(q, straight_lines))) for q in sg.grid])
                    == texts[p]
                )

        # All paths start from a firefly
        path_orders = {p: var() for p in sg.grid}
        for p in sg.grid:
            sg.solver.add(Implies(sg.grid[p] != symbol_set.EMPTY, path_orders[p] >= 1))
            sg.solver.add(Implies(path_orders[p] == 1, any(p == q.translate(v) for q, v in fireflies.items())))
            sg.solver.add(
                Or(
                    path_orders[p] <= 1,
                    *[
                        And(
                            sg.cell_is_one_of(p, symbol_set.symbols_for_direction(n.direction)),
                            n.symbol != symbol_set.EMPTY,
                            path_orders[n.location] < path_orders[p],
                        )
                        for n in sg.edge_sharing_neighbors(p)
                    ]
                )
            )

        # All paths form one connected network
        tree = {p: var() for p in sg.grid}
        for p in sg.grid:
            sg.solver.add(Implies(p in symbols or sg.grid[p] != symbol_set.EMPTY, tree[p] >= 1))
            sg.solver.add(
                Or(
                    tree[p] <= 1,
                    *[
                        And(
                            Or(
                                sg.cell_is_one_of(p, symbol_set.symbols_for_direction(n.direction)),
                                sg.cell_is_one_of(
                                    n.location,
                                    symbol_set.symbols_for_direction(sg.lattice.opposite_direction(n.direction)),
                                ),
                            ),
                            n.location in symbols or n.symbol != symbol_set.EMPTY,
                            tree[n.location] < tree[p],
                        )
                        for n in sg.edge_sharing_neighbors(p)
                    ]
                )
            )
        sg.solver.add(Sum([tree[p] == 1 for p in sg.grid]) == 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] in symbol_set.symbols_for_direction(Directions.E):
                solution.borders[p, p.translate(Directions.N)] = True
            if solved_grid[p] in symbol_set.symbols_for_direction(Directions.S):
                solution.borders[p, p.translate(Directions.W)] = True
            if solved_grid[p] in symbol_set.symbols_for_direction(Directions.W):
                solution.borders[p.translate(Directions.NW), p.translate(Directions.W)] = True
            if solved_grid[p] in symbol_set.symbols_for_direction(Directions.N):
                solution.borders[p.translate(Directions.NW), p.translate(Directions.N)] = True
