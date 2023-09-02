from lib import *


class CrissCross(AbstractSolver):
    def run(self, puzzle, solve):
        words = [text for p, text in puzzle.texts.items() if p not in puzzle.points]
        all_letters = list(set(c for word in words for c in word))

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(-1, len(all_letters)))

        def good(p):
            return p in sg.grid and p not in puzzle.shaded

        # Find all lines in the grid for words; all other squares must be blank
        lines = []
        for p in sg.grid:
            if good(p):
                for v in Directions.E, Directions.S:
                    if good(p.translate(v)) and not good(p.translate(v.vector.negate())):
                        lines.append(sight_line(sg, p, v, good))
            else:
                sg.solver.add(sg.grid[p] == -1)

        # Each line must be occupied by one distinct word (of the same length)
        word_vars = [var() for _ in words]
        for i, line in enumerate(lines):
            choices = []
            for word, word_var in zip(words, word_vars):
                if len(word) == len(line):
                    choices.append(
                        And(word_var == i, *[sg.grid[p] == all_letters.index(c) for c, p in zip(word, line)])
                    )
            sg.solver.add(Or(choices))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] != -1:
                solution.texts[p] = all_letters[solved_grid[p]]
