from collections import defaultdict

from lib import *


class KinKonKan(AbstractSolver):
    def run(self, puzzle, solve):
        labels = list(set(puzzle.texts.values()))

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(-1, 1))

        # Each region has one mirror
        for region in puzzle.regions():
            sg.solver.add(Sum([sg.grid[p] != -1 for p in region]) == 1)

        # Mirrors connect labels
        edge_sharing_vectors = [v.vector for v in sg.lattice.edge_sharing_directions()]
        lasers = defaultdict(var)
        for p, v in puzzle.entrance_points():
            sg.solver.add(lasers[p, v.vector] == -1)
        for p in sg.grid:
            for v in edge_sharing_vectors:
                sg.solver.add(lasers[p, v] == -1)
        for _ in sg.grid:
            new_lasers = defaultdict(var)
            for p, v in puzzle.entrance_points():
                sg.solver.add(new_lasers[p, v.vector] == (labels.index(puzzle.texts[p]) if p in puzzle.texts else -1))
            for p in sg.grid:
                for v in edge_sharing_vectors:
                    sg.solver.add(Implies(sg.grid[p] == -1, lasers[p.translate(v.negate()), v] == new_lasers[p, v]))
                    w = Vector(v.dx, v.dy)
                    sg.solver.add(Implies(sg.grid[p] == 0, lasers[p.translate(w.negate()), w] == new_lasers[p, v]))
                    w = Vector(-v.dx, -v.dy)
                    sg.solver.add(Implies(sg.grid[p] == 1, lasers[p.translate(w.negate()), w] == new_lasers[p, v]))
            lasers = new_lasers
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(lasers[p.translate(v.vector), v.vector.negate()] == labels.index(puzzle.texts[p]))

        # Each label goes through the specified number of mirrors
        for i, label in enumerate(labels):
            number = int(list(filter(str.isdigit, label))[0])
            sg.solver.add(
                Sum([And(sg.grid[q] != -1, Or([lasers[q, v] == i for v in edge_sharing_vectors])) for q in sg.grid])
                == number
            )

        # Each mirror must be used
        for p in sg.grid:
            sg.solver.add(Implies(sg.grid[p] != -1, Or([lasers[p, v] != -1 for v in edge_sharing_vectors])))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if solved_grid[p] == 0:
                solution.symbols[p] = Symbols.NW_TO_SE
            elif solved_grid[p] == 1:
                solution.symbols[p] = Symbols.NE_TO_SW
