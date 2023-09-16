from lib import *


class Battleships(AbstractSolver):
    def run(self, puzzle, solve):
        lengths = [int(c) for c in puzzle.parameters["lengths"]]

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, 6))

        # Satisfy ship counts
        for p, v in puzzle.entrance_points():
            if p in puzzle.texts:
                sg.solver.add(Sum([sg.grid[q] > 0 for q in sight_line(sg, p.translate(v), v)]) == puzzle.texts[p])

        # Enumerate all possibilities for each ship
        ship_indices = {p: var() for p in sg.grid}
        sg.solver.add(Sum([ship_index >= 0 for ship_index in ship_indices.values()]) == len(lengths))
        for i, length in enumerate(lengths):
            choices = []
            for p in sg.grid:
                if length == 1:
                    choices.append(
                        And(
                            [
                                sg.grid[p] == 1,
                                ship_indices[p] == i,
                                *[n.symbol == 0 for n in sg.vertex_sharing_neighbors(p)],
                            ]
                        )
                    )
                else:
                    for v, start_ship, end_ship in ((Directions.E, 3, 5), (Directions.S, 4, 6)):
                        points = [Point(p.y + v.vector.dy * i, p.x + v.vector.dx * i) for i in range(length)]
                        choices.append(
                            And(
                                [
                                    sg.grid[p] == start_ship,
                                    *[sg.grid.get(q) == 2 for q in points[1:-1]],
                                    sg.grid.get(points[-1]) == end_ship,
                                    ship_indices[p] == i,
                                    *[
                                        n.symbol == 0
                                        for q in points
                                        for n in sg.vertex_sharing_neighbors(q)
                                        if n.location not in points
                                    ],
                                ]
                            )
                        )
            sg.solver.add(Or(choices))

        # Satisfy given ship parts/water
        for p, symbol in puzzle.symbols.items():
            if symbol.shape.startswith("battleship_"):
                sg.solver.add(sg.grid[p] == (0 if symbol.style == 7 else symbol.style))

        solved_grid, solution = solve(sg)
        for p in sg.grid:
            if p not in puzzle.symbols:
                solution.symbols[p] = Symbol(solved_grid[p], "battleship_B") if solved_grid[p] else Symbols.WATER
