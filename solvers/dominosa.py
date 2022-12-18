from lib import *


class Dominosa(AbstractSolver):
    def run(self, puzzle, solve):
        dominoes = [(a, b) for a in range(max(puzzle.texts.values()) + 1) for b in range(a + 1)]

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(dominoes) - 1))

        # A mapping from each domino to the two points (y,x) it is in the grid.
        all_locations = [[[var() for _ in range(2)] for _ in range(2)] for _ in dominoes]
        for locations in all_locations:
            for y, x in locations:
                sg.solver.add(And(y >= 0, y < puzzle.height, x >= 0, x < puzzle.width))

        # The mapping from grid to domino and domino to grid are consistent.
        for p in sg.grid:
            for domino_index, (domino, locations) in enumerate(zip(dominoes, all_locations)):
                sg.solver.add(Implies(sg.grid[p] == domino_index, Or([And(y == p.y, x == p.x) for y, x in locations])))
                for number, (y, x) in zip(domino, locations):
                    sg.solver.add(
                        Implies(
                            And(y == p.y, x == p.x),
                            # Only allow a mapping from domino to grid if the corresponding grid number is correct
                            sg.grid[p] == domino_index if puzzle.texts.get(p) == number else False,
                        )
                    )

        # The two squares of each domino are adjacent
        for p in sg.grid:
            sg.solver.add(Or([sg.grid[p] == domino_index.symbol for domino_index in sg.edge_sharing_neighbors(p)]))

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
