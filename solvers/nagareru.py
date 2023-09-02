from lib import *


class Nagareru(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), PathSymbolSet(puzzle.lattice_type))
        pc = PathConstrainer(sg, loop=True)

        for p in puzzle.shaded:
            sg.solver.add(sg.grid[p] == 0)

        for p, symbol in puzzle.symbols.items():
            (v,) = puzzle.symbols[p].get_arrows()
            if symbol.is_black():
                # The loop goes through black arrows
                sg.solver.add(pc.some_follows(p, p.translate(v)))
                sg.solver.add(pc.some_follows(p.translate(v.vector.negate()), p))
            else:
                # If the loop goes into a lane with a white arrow, it must move once in that direction
                line = sight_line(sg, p.translate(v), v, lambda q: q in sg.grid and q not in puzzle.shaded)
                sg.solver.add(Or([sg.grid[q] != 0 for q in line]))
                for q in line:
                    sg.solver.add(
                        Implies(
                            And(sg.grid[q] != 0, Not(pc.some_follows(q.translate(v.vector.negate()), q))),
                            pc.some_follows(q, q.translate(v)),
                        )
                    )

        solved_grid, solution = solve(sg)
        for p in puzzle.points:
            for v in sg.symbol_set.dir_sets[solved_grid[p]]:
                solution.lines[p, p.translate(v)] = True
