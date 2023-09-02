from lib import *


class HebiIchigo(AbstractSolver):
    def run(self, puzzle, solve):
        count = 5

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, count))
        rc = RegionConstrainer(sg.lattice, sg.solver, complete=False, min_region_size=5, max_region_size=5)

        for p in sg.grid:
            sg.solver.add((sg.grid[p] == 0) == (rc.region_id_grid[p] == -1))

        for p in puzzle.shaded:
            sg.solver.add(sg.grid[p] == 0)

        # Each snake consists of the numbers 1-5 in order
        for p in sg.grid:
            for i in range(1, count + 1):
                if i + 1 <= count:
                    sg.solver.add(
                        Implies(sg.grid[p] == i, Sum([n.symbol == i + 1 for n in sg.edge_sharing_neighbors(p)]) == 1)
                    )
                if i - 1 >= 1:
                    sg.solver.add(
                        Implies(sg.grid[p] == i, Sum([n.symbol == i - 1 for n in sg.edge_sharing_neighbors(p)]) == 1)
                    )

        # A snake cannot "see" another snake (the cells on the side of a 1 opposite that of the 2 must be empty)
        for p in sg.grid:
            for n in sg.edge_sharing_neighbors(p):
                q = p.translate(n.direction)
                line = sight_line(
                    sg, q.translate(n.direction), n.direction, lambda r: r in sg.grid and r not in puzzle.shaded
                )
                sg.solver.add(Implies(And(sg.grid[p] == 2, sg.grid[q] == 1), And([sg.grid[r] == 0 for r in line])))

        # A number and arrow means that the number is the first number seen in that arrow direction
        for p, number in puzzle.texts.items():
            (v,) = puzzle.symbols[p].get_arrows()
            line = sight_line(sg, p.translate(v), v, lambda q: q in sg.grid and q not in puzzle.shaded)
            choices = []
            if number == 0:
                choices.append(And([sg.grid[q] == 0 for q in line]))
            else:
                for i, q in enumerate(line):
                    choices.append(And(*[sg.grid[r] == 0 for r in line[:i]], sg.grid[q] == number))
            sg.solver.add(Or(choices))

        no_adjacent_regions(sg, rc)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != 0:
                solution.texts[p] = solved_grid[p]
