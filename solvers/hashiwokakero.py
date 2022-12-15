from collections import defaultdict

from lib import *


class Hashiwokakero(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        number_positions = list(puzzle.texts.keys())

        sg = init_symbol_grid(
            grilops.get_square_lattice(len(number_positions)),
            grilops.make_number_range_symbol_set(0, 2))

        # Neighbor graph is symmetric and has no self-edges
        for edge in sg.grid:
            if edge.x < edge.y:
                sg.solver.add(sg.grid[edge] == sg.grid[Point(edge.x, edge.y)])

        # Only orthogonally adjacent islands can have bridges
        edges = []
        for edge in sg.grid:
            p, q = number_positions[edge.x], number_positions[edge.y]
            if edge.x == edge.y:
                sg.solver.add(sg.grid[edge] == 1)
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
        graph = defaultdict(var)
        sg.solver.add(Sum([graph[edge] == 0 for edge in edges if edge.x < edge.y]) == 1)
        for edge in edges:
            sg.solver.add(graph[edge] >= 0)
            sg.solver.add(graph[edge] < len(number_positions))
            sg.solver.add(graph[edge] == graph[Point(edge.x, edge.y)])
            sg.solver.add(Or(
                sg.grid[edge] == 0,
                graph[edge] == 0,
                *[And(graph[edge] > graph[other_edge], sg.grid[other_edge] != 0)
                  for other_edge in edges if other_edge.x == edge.x],
                *[And(graph[edge] > graph[other_edge], sg.grid[other_edge] != 0)
                  for other_edge in edges if other_edge.y == edge.y]))

    def set_solved(self, puzzle, sg, solved_grid, solution):
        number_positions = list(puzzle.texts.keys())

        for edge in sg.grid:
            if solved_grid[edge] != 0:
                p, q = number_positions[edge.x], number_positions[edge.y]
                shape = 30 if solved_grid[edge] == 2 else 3
                if p.y == q.y:
                    for x in range(min(p.x, q.x), max(p.x, q.x)):
                        solution.lines[frozenset((Point(p.y, x), Point(p.y, x + 1)))] = shape
                elif p.x == q.x:
                    for y in range(min(p.y, q.y), max(p.y, q.y)):
                        solution.lines[frozenset((Point(y, p.x), Point(y + 1, p.x)))] = shape
