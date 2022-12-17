from lib import *


class TomTom(AbstractSolver):
    def configure(self, puzzle, init_symbol_grid):
        regions = dict([(p, i) for i, region in enumerate(puzzle.regions()) for p in region])

        sg = init_symbol_grid(puzzle.lattice(), grilops.make_number_range_symbol_set(1, puzzle.width))

        for (p, _), text in puzzle.edge_texts.items():
            region = [q for q in sg.grid if regions[p] == regions[q]]
            text = str(text)
            number = int("".join(filter(lambda c: c.isnumeric(), text)))

            choices = []
            if text.isnumeric() or "+" in text:
                choices.append(Sum([sg.grid[q] for q in region]) == number)
            if text.isnumeric() or any(c in text for c in "*x×"):
                choices.append(Product([sg.grid[q] for q in region]) == number)

            # For subtraction and division, try all possible values of the largest number, in all possible locations
            for max_p in region:
                for max_d in range(1, puzzle.width + 1):
                    if text.isnumeric() or any(c in text for c in "-−"):
                        choices.append(
                            And(
                                sg.grid[max_p] == max_d,
                                Sum([sg.grid[q] for q in region if q != max_p]) == max_d - number,
                            )
                        )
                    if (text.isnumeric() or any(c in text for c in "/÷")) and max_d % number == 0:
                        choices.append(
                            And(
                                sg.grid[max_p] == max_d,
                                Product([sg.grid[q] for q in region if q != max_p]) == max_d // number,
                            )
                        )
            sg.solver.add(Or(choices))

        # Rows and columns are distinct
        for p, v in puzzle.entrance_points():
            sg.solver.add(Distinct([sg.grid[q] for q in sight_line(sg, p.translate(v), v)]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        for p in sg.grid:
            solution.texts[p] = solved_grid[p]
