from lib import *


class Compass(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, len(puzzle.points)))
        rc = RegionConstrainer(sg.lattice, sg.solver)

        region_ids = []
        for (p, v), number in puzzle.edge_texts.items():
            # Each region is rooted at the square with counts
            region_id = sg.lattice.point_to_index(p)
            sg.solver.add(rc.region_id_grid[p] == region_id)
            region_ids.append(region_id)

            # Counts are correct (a box affects the count if the dot product of the displacement vectors is positive)
            dy, dx = v.vector
            sg.solver.add(
                Sum([sg.grid[p] == sg.grid[q] for q in sg.grid if (q.y - p.y) * dy + (q.x - p.x) * dx > 0]) == number)

        for p in sg.grid:
            sg.solver.add(sg.grid[p] == rc.region_id_grid[p])
            sg.solver.add(sg.cell_is_one_of(p, region_ids))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_regions(puzzle, solved_grid)