from lib import *


class Nagareru(AbstractSolver):
    def run(self, puzzle, solve):
        lattice = puzzle.lattice()
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append("EMPTY")

        sg = SymbolGrid(lattice, symbol_set)
        LoopConstrainer(sg, single_loop=True)

        for p in puzzle.shaded:
            sg.solver.add(sg.grid[p] == symbol_set.EMPTY)

        loop_direction = require_loop_direction(sg)
        for p, symbol in puzzle.symbols.items():
            (v,) = puzzle.symbols[p].get_arrows()
            if symbol.is_black():
                # The loop goes through black arrows
                sg.solver.add(loop_direction[p.translate(v.vector.negate())] == v)
                sg.solver.add(loop_direction[p] == v)
            else:
                # If the loop goes into a lane with a white arrow, it must move once in that direction
                line = sight_line(sg, p.translate(v), v, lambda q: q in sg.grid and q not in puzzle.shaded)
                sg.solver.add(Or([sg.grid[q] != symbol_set.EMPTY for q in line]))
                for q in line:
                    sg.solver.add(
                        Implies(
                            And(sg.grid[q] != symbol_set.EMPTY, loop_direction[q.translate(v.vector.negate())] != v),
                            loop_direction[q] == v,
                        )
                    )

        solved_grid, solution = solve(sg)
        solution.set_paths(sg, solved_grid)
