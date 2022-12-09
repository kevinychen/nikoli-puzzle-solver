from solvers.utils import *


class Heyawake(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(
            grilops.get_rectangle_lattice(puzzle.height, puzzle.width),
            grilops.make_number_range_symbol_set(0, 1))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        regions = dict([(p, i) for i, region in enumerate(puzzle.to_regions(sg.lattice.points)) for p in region])

        # No "word", i.e. line of white squares visiting at least three regions
        for v in Directions.E, Directions.S:
            for p in sg.grid:
                word = []
                while p in sg.grid:
                    word.append(p)
                    if len(set(regions[q] for q in word)) >= 3:
                        sg.solver.add(Or([sg.cell_is(q, 1) for q in word]))
                        break
                    p = p.translate(v)

        # Number of black squares in each region is correct
        for p, text in puzzle.texts.items():
            sg.solver.add(Sum([sg.grid[q] for q in sg.lattice.points if regions[q] == regions[p]]) == text)

        continuous_region(sg, rc, lambda q: sg.cell_is(q, 0))
        no_adjacent_symbols(sg, 1)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if solved_grid[p] == 1:
                solution.shaded[p] = True
