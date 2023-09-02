from lib import *


class RoundTrip(AbstractSolver):
    def run(self, puzzle, solve):
        sg = SymbolGrid(puzzle.lattice(), PathSymbolSet(puzzle.lattice_type))
        pc = PathConstrainer(sg, crossing=True, loop=True)

        # Given numbers represent the length of the closest segment of loop that goes along that line
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                line = sight_line(sg, p.translate(v), v)
                length = puzzle.texts[p]
                choices = []
                for i in range(length, len(line) + 1):
                    choices.append(
                        And(
                            *[Not(pc.some_adjacent(line[j], line[j + 1])) for j in range(i - length)],
                            *[pc.some_adjacent(line[j], line[j + 1]) for j in range(i - length, i - 1)],
                            True if i == len(line) else Not(pc.some_adjacent(line[i - 1], line[i])),
                        )
                    )
                sg.solver.add(Or(choices))

        solved_grid, solution = solve(sg)
        for p in puzzle.points:
            for v in sg.symbol_set.dir_sets[solved_grid[p]]:
                solution.lines[p, p.translate(v)] = True
