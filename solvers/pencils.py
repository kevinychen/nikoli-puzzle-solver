from lib import *


class Pencils(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = PathSymbolSet(lattice)
        symbol_set.append("EMPTY")
        for v in puzzle.lattice_type.edge_sharing_directions():
            symbol_set.append(f"PENCIL_{v.name}")

        sg = SymbolGrid(lattice, symbol_set)
        pc = PathConstrainer(sg, allow_loops=False)
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False)

        for p in sg.grid:
            # Regions correspond to pencils
            sg.solver.add(
                sg.cell_is_one_of(p, [i for i, s in symbol_set.symbols.items() if s.name.startswith("PENCIL_")])
                == (rc.region_id_grid[p] != -1)
            )

            # Pencils are straight lines, and they either continue, or end at a pencil tip that draws a path
            for v in sg.lattice.edge_sharing_directions():
                q = p.translate(v)
                sg.solver.add(
                    Implies(
                        sg.grid[p] == symbol_set[f"PENCIL_{v.name}"],
                        Or(
                            And(sg.grid[p] == sg.grid.get(q), rc.region_id_grid[p] == rc.region_id_grid.get(q)),
                            And(
                                symbol_set.is_terminal(sg.grid[q]) if q in sg.grid else False,
                                pc.path_order_grid.get(q) == rc.region_size_grid[p],
                            ),
                        ),
                    )
                )

        # Given numbers (pencil lengths) are correct
        for p, number in puzzle.texts.items():
            sg.solver.add(rc.region_size_grid[p] == number)

        # Given pencil tips
        for p, pencil in puzzle.symbols.items():
            (v,) = pencil.get_arrows()
            sg.solver.add(And(symbol_set.is_terminal(sg.grid[p]), pc.path_order_grid[p] != 0))
            sg.solver.add(sg.grid[p.translate(v)] == symbol_set[f"PENCIL_{sg.lattice.opposite_direction(v).name}"])

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            for n in sg.edge_sharing_neighbors(p):
                q = n.location
                is_pencil_p = symbol_set.symbols[solved_grid[p]].name.startswith("PENCIL_")
                is_pencil_q = symbol_set.symbols[solved_grid[q]].name.startswith("PENCIL_")
                if is_pencil_p or is_pencil_q:
                    if solved_grid[p] == solved_grid[q]:
                        if solved_grid[p] == symbol_set[f"PENCIL_{n.direction.name}"]:
                            continue
                        if solved_grid[p] == symbol_set[f"PENCIL_{sg.lattice.opposite_direction(n.direction).name}"]:
                            continue
                    solution.borders[p, n.location] = True
                if is_pencil_p and not is_pencil_q and solved_grid[p] == symbol_set[f"PENCIL_{n.direction.name}"]:
                    solution.symbols[q] = Symbol.from_arrow("pencils", sg.lattice.opposite_direction(n.direction))
        solution.set_paths(sg, solved_grid)
