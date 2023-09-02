from lib import *


class Heyawake(AbstractSolver):
    def run(self, puzzle, solve):
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 1))

        # Number of black squares in each region is correct
        for p, number in puzzle.texts.items():
            sg.solver.add(Sum([sg.grid[q] for q in sg.grid if regions[p] == regions[q]]) == number)

        # No "word", i.e. line of white squares visiting at least three regions
        for v in sg.lattice.edge_sharing_directions():
            for p in sg.grid:
                word = []
                while p in sg.grid:
                    word.append(p)
                    if len(set(regions[q] for q in word)) >= 3:
                        sg.solver.add(Or([sg.grid[q] == 1 for q in word]))
                        break
                    p = p.translate(v)

        require_continuous(sg, lambda q: sg.grid[q] == 0)
        no_adjacent_symbols(sg, 1)

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p]:
                solution.shaded[p] = True
