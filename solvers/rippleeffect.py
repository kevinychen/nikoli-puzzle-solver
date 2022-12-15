from lib import *


class RippleEffect(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        regions = puzzle.regions()

        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, max(map(len, regions))))

        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == number)

        for region in regions:
            sg.solver.add(Distinct([sg.grid[p] for p in region]))
            for p in region:
                choices = []
                for i in range(1, len(region) + 1):
                    # if a square has number i, then none of the squares within distance i in any direction are i
                    choices.append(And([
                        sg.grid[p] == i,
                        *[sg.grid[q] != i for v in sg.lattice.edge_sharing_directions()
                          for q in sight_line(sg, p.translate(v), v)[:i]]]))
                sg.solver.add(Or(choices))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            if p not in puzzle.texts:
                solution.texts[p] = solved_grid[p]
