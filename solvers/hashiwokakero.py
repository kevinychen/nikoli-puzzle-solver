from lib import *


class Hashiwokakero(AbstractSolver):
    def run(self, puzzle, solve):
        number_positions = list(puzzle.texts.keys())

        sg = SymbolGrid(grilops.get_square_lattice(len(number_positions)), grilops.make_number_range_symbol_set(0, 2))

        # Neighbor graph is symmetric and has no self-edges
        for edge in sg.grid:
            sg.solver.add(sg.grid[edge] == sg.grid[Point(edge.x, edge.y)])

        # Only orthogonally adjacent islands can have bridges
        edges = []
        for edge in sg.grid:
            p, q = number_positions[edge.x], number_positions[edge.y]
            if edge.x == edge.y:
                sg.solver.add(sg.grid[edge] == 0)
            elif p.y == q.y and all(Point(p.y, x) not in puzzle.texts for x in range(min(p.x, q.x) + 1, max(p.x, q.x))):
                edges.append(edge)
            elif p.x == q.x and all(Point(y, p.x) not in puzzle.texts for y in range(min(p.y, q.y) + 1, max(p.y, q.y))):
                edges.append(edge)
            else:
                sg.solver.add(sg.grid[edge] == 0)

        # Each island has the correct number of bridges connected to it
        for i, p in enumerate(number_positions):
            sg.solver.add(Sum([sg.grid[edge] for edge in edges if i == edge.x]) == puzzle.texts[p])

        # Bridges cannot intersect
        for edge1 in edges:
            for edge2 in edges:
                p1, q1 = number_positions[edge1.x], number_positions[edge1.y]
                p2, q2 = number_positions[edge2.x], number_positions[edge2.y]
                if p1.x == q1.x and p2.y == q2.y and p1.y < p2.y < q1.y and p2.x < p1.x < q2.x:
                    sg.solver.add(Or(sg.grid[edge1] == 0, sg.grid[edge2] == 0))

        # Bridges are all connected
        require_continuous(
            sg,
            lambda e: sg.grid[e] != 0,
            lambda e: [
                edge2 if edge2.y < edge2.x else Point(edge2.x, edge2.y)
                for edge2 in edges
                if edge2.x == e.x or edge2.y == e.y
            ],
        )

        solved_grid, solution = solve(sg)
        for edge in sg.grid:
            if solved_grid[edge] != 0:
                p, q = number_positions[edge.x], number_positions[edge.y]
                shape = 30 if solved_grid[edge] == 2 else 3
                if p.y == q.y:
                    for x in range(min(p.x, q.x), max(p.x, q.x)):
                        solution.lines[Point(p.y, x), Point(p.y, x + 1)] = shape
                elif p.x == q.x:
                    for y in range(min(p.y, q.y), max(p.y, q.y)):
                        solution.lines[Point(y, p.x), Point(y + 1, p.x)] = shape
