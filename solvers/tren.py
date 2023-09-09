from lib import *


class Tren(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(-1, len(puzzle.points)))

        # Find a list of all car possibilities for each number
        car_choices = {p: [] for p in puzzle.texts}
        for p, number in puzzle.texts.items():
            sg.solver.add(sg.grid[p] == sg.lattice.point_to_index(p))

            for v, w in straight_edge_sharing_direction_pairs(sg):
                line1, line2 = sight_line(sg, p.translate(v), v), sight_line(sg, p.translate(w), w)
                for i in range(len(line1) + 1):
                    for j in range(len(line2) + 1):
                        if i + j + 1 in (2, 3):
                            car = set([p] + line1[:i] + line2[:j])
                            car_choices[p].append((line1, line2, i, j, car))

        # The number must represent the number of ways that the car can move (in the direction of the car)
        car_choice_indices = {p: var() for p in puzzle.texts}
        for p, number in puzzle.texts.items():
            choices = []
            for index, (line1, line2, i, j, car) in enumerate(car_choices[p]):
                choices.append(
                    And(
                        car_choice_indices[p] == index,
                        *[sg.grid[q] == sg.grid[p] for q in car],
                        Sum(
                            [And([sg.grid[q] == -1 for q in line1[i:k]]) for k in range(i + 1, len(line1) + 1)]
                            + [And([sg.grid[q] == -1 for q in line2[j:k]]) for k in range(j + 1, len(line2) + 1)]
                        )
                        == number,
                    )
                )
            sg.solver.add(Or(choices))

        # If none of the cars touch this square, this square is empty
        for p in sg.grid:
            choices = [sg.grid[p] == -1]
            for q in puzzle.texts:
                for i, (_, _, _, _, car) in enumerate(car_choices[q]):
                    if p in car:
                        choices.append(car_choice_indices[q] == i)
            sg.solver.add(Or(choices))

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
