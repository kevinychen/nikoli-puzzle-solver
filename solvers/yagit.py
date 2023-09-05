from math import atan2

from lib import *


class Yagit(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])

        # No region contains different symbols
        for p, symbol1 in puzzle.symbols.items():
            for q, symbol2 in puzzle.symbols.items():
                if symbol1 != symbol2:
                    sg.solver.add(sg.grid[p] != sg.grid[q])

        # No regions are empty
        for p in sg.grid:
            sg.solver.add(Or([rc.region_id_grid[p] == rc.region_id_grid[q] for q in puzzle.symbols]))

        for junction in junctions(sg):
            center = (sum(p.y for p in junction) / len(junction), sum(p.x for p in junction) / len(junction))
            junction = sorted(junction, key=lambda p: atan2(p[0] - center[0], p[1] - center[1]))
            lines = [sg.grid[junction[i - 1]] != sg.grid[junction[i]] for i in range(len(junction))]
            sg.solver.add(Sum(lines) != 3)
            if frozenset(junction) in puzzle.junction_symbols:
                # Lines cannot cross at dots
                sg.solver.add(Sum(lines) <= 2)
            else:
                # Lines can only turn at dots
                for i in range(len(lines) // 2):
                    sg.solver.add(lines[i] == lines[i + len(lines) // 2])

        # Ensure solution is unique
        for p in sg.grid:
            sg.solver.add(sg.grid[p] >= sg.lattice.point_to_index(p))

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
