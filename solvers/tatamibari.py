from lib import *


class Tatamibari(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])
            sg.solver.add((rc.parent_grid[p] == R) == (p in puzzle.texts))

        for p, symbol in puzzle.texts.items():
            # Each symbol is part of a rectangle
            top, bottom, left, right = var(), var(), var(), var()
            sg.solver.add(top >= 0)
            sg.solver.add(top <= p.y)
            sg.solver.add(bottom >= 0)
            sg.solver.add(bottom < puzzle.height - p.y)
            sg.solver.add(left >= 0)
            sg.solver.add(left <= p.x)
            sg.solver.add(right >= 0)
            sg.solver.add(right < puzzle.width - p.x)
            for q in sg.grid:
                sg.solver.add(
                    And(q.y >= p.y - top, q.y <= p.y + bottom, q.x >= p.x - left, q.x <= p.x + right)
                    == (sg.grid[q] == sg.grid[p])
                )

            # Constrain dimensions of rectangle based on symbol
            if symbol == "+":
                sg.solver.add(top + bottom == left + right)
            elif symbol == "-":
                sg.solver.add(top + bottom < left + right)
            elif symbol == "|":
                sg.solver.add(top + bottom > left + right)

        # Four pieces cannot share the same corner
        for junction in junctions(sg):
            sg.solver.add(Not(Distinct([sg.grid[p] for p in junction])))

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
