from lib import *


class Magnets(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(-1, 1))

        # Each region is either a magnet with a + and -, or empty
        for p, q in puzzle.regions():
            sg.solver.add(sg.grid[p] + sg.grid[q] == 0)

        # Given numbers are correct.
        # A number is considered to be for plus signs if there is a straight line to the + symbol.
        plus_sign = next(p for p, symbol in puzzle.symbols.items() if symbol == Symbols.PLUS_SIGN)

        def is_plus_sign_number(r):
            return any(
                (r.y - plus_sign.y) * w.vector.dx == (r.x - plus_sign.x) * w.vector.dy
                for w in sg.lattice.edge_sharing_directions()
            )

        for p, v in puzzle.entrance_points():
            line = sight_line(sg, p.translate(v), v)
            for q in p, p.translate(v.vector.negate()):
                if q in puzzle.texts:
                    value = 1 if is_plus_sign_number(q) else -1
                    sg.solver.add(Sum([sg.grid[r] == value for r in line]) == puzzle.texts[q])

        for symbol in +1, -1:
            no_adjacent_symbols(sg, symbol)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != 0:
                solution.symbols[p] = Symbols.PLUS_SIGN if solved_grid[p] == 1 else Symbols.MINUS_SIGN
