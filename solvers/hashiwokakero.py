from solvers.utils import *


class HashiwokakeroSolver(AbstractSolver):

    def __init__(self, pzprv3):
        matched = match('pzprv3/hashikake/(\\d+)/(\\d+)/(.*)/', pzprv3)
        self.height = int(matched.group(1))
        self.width = int(matched.group(2))
        self.grid = parse_table(matched.group(3))[:self.height]
        self.number_positions = [Point(row, col) for row in range(self.height) for col in range(self.width)
                                 if self.grid[row][col].isnumeric()]
        self.num_numbers = len(self.number_positions)

    def to_pzprv3(self, solved_grid):
        horizontals = [['0' for _ in range(self.width - 1)] for _ in range(self.height)]
        verticals = [['0' for _ in range(self.width)] for _ in range(self.height - 1)]
        for edge in self.lattice().points:
            if solved_grid[edge] != 0:
                p, q = self.number_positions[edge.x], self.number_positions[edge.y]
                if p.y == q.y:
                    for x in range(min(p.x, q.x), max(p.x, q.x)):
                        horizontals[p.y][x] = str(solved_grid[edge])
                elif p.x == q.x:
                    for y in range(min(p.y, q.y), max(p.y, q.y)):
                        verticals[y][p.x] = str(solved_grid[edge])
        return (
            'pzprv3/hashikake/'
            f'{self.height}/{self.width}/{table(self.grid)}/{table(horizontals)}/{table(verticals)}/')

    def lattice(self):
        return grilops.get_square_lattice(self.num_numbers)

    def symbol_set(self):
        return grilops.make_number_range_symbol_set(0, 2)

    def configure(self, sg):
        # Neighbor graph is symmetric and has no self-edges
        for edge in sg.lattice.points:
            if edge.x < edge.y:
                sg.solver.add(sg.grid[edge] == sg.grid[Point(edge.x, edge.y)])

        # Only orthogonally adjacent islands can have bridges
        edges = []
        for edge in sg.lattice.points:
            p, q = self.number_positions[edge.x], self.number_positions[edge.y]
            if edge.x == edge.y:
                pass
            elif p.y == q.y and all(not self.grid[p.y][x].isnumeric() for x in range(min(p.x, q.x) + 1, max(p.x, q.x))):
                edges.append(edge)
            elif p.x == q.x and all(not self.grid[y][p.x].isnumeric() for y in range(min(p.y, q.y) + 1, max(p.y, q.y))):
                edges.append(edge)
            else:
                sg.solver.add(sg.cell_is(edge, 0))

        # Each island has the correct number of bridges connected to it
        for i, p in enumerate(self.number_positions):
            sg.solver.add(Sum([sg.grid[edge] for edge in edges if i == edge.x]) == int(self.grid[p.y][p.x]))

        # Bridges cannot intersect
        for edge1 in edges:
            for edge2 in edges:
                p1, q1 = self.number_positions[edge1.x], self.number_positions[edge1.y]
                p2, q2 = self.number_positions[edge2.x], self.number_positions[edge2.y]
                if p1.x == q1.x and p2.y == q2.y and p1.y < p2.y < q1.y and p2.x < p1.x < q2.x:
                    sg.solver.add(Or(sg.cell_is(edge1, 0), sg.cell_is(edge2, 0)))

        # Bridges are all connected
        graph = defaultdict(lambda: Int(str(uuid4())))
        sg.solver.add(PbEq([(graph[edge] == 0, 1) for edge in edges if edge.x < edge.y], 1))
        for edge in edges:
            sg.solver.add(graph[edge] >= 0)
            sg.solver.add(graph[edge] < self.num_numbers)
            sg.solver.add(graph[edge] == graph[Point(edge.x, edge.y)])
            sg.solver.add(Or(
                sg.cell_is(edge, 0),
                graph[edge] == 0,
                *[And(graph[edge] > graph[other_edge], sg.grid[other_edge] != 0)
                  for other_edge in edges if other_edge.x == edge.x],
                *[And(graph[edge] > graph[other_edge], sg.grid[other_edge] != 0)
                  for other_edge in edges if other_edge.y == edge.y]))
