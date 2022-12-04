from solvers.utils import *


class Masyu(AbstractSolver):

    def configure(self):
        lattice = grilops.get_rectangle_lattice(self.height, self.width)
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append('empty', ' ')

        sg = self.get_symbol_grid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        circles = [p for p in sg.lattice.points if p in self.symbols and self.symbols[p].shape.startswith('circle_')]
        for p in circles:
            if self.symbols[p].style in (1, 6, 8):  # white
                choices = []
                if 0 < p.x < self.width - 1:
                    choices.append(And(sg.cell_is(p, symbol_set.EW), Or(
                        sg.cell_is_one_of(Point(p.y, p.x - 1), [symbol_set.NE, symbol_set.SE]),
                        sg.cell_is_one_of(Point(p.y, p.x + 1), [symbol_set.NW, symbol_set.SW]))))
                if 0 < p.y < self.height - 1:
                    choices.append(And(sg.cell_is(p, symbol_set.NS), Or(
                        sg.cell_is_one_of(Point(p.y - 1, p.x), [symbol_set.SW, symbol_set.SE]),
                        sg.cell_is_one_of(Point(p.y + 1, p.x), [symbol_set.NW, symbol_set.NE]))))
                sg.solver.add(Or(*choices))
            elif self.symbols[p].style == 2:  # black
                sg.solver.add(sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.NE, symbol_set.SW, symbol_set.SE]))
                if p.x > 0:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.SW]),
                        sg.cell_is(Point(p.y, p.x - 1), symbol_set.EW)))
                if p.x < self.width - 1:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NE, symbol_set.SE]),
                        sg.cell_is(Point(p.y, p.x + 1), symbol_set.EW)))
                if p.y > 0:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.NE]),
                        sg.cell_is(Point(p.y - 1, p.x), symbol_set.NS)))
                if p.y < self.height - 1:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.SW, symbol_set.SE]),
                        sg.cell_is(Point(p.y + 1, p.x), symbol_set.NS)))

        # Optimization: loop starts at one of the circles
        if circles:
            sg.solver.add(lc.loop_order_grid[circles[0]] == 0)

    def to_standard_format(self, sg, solved_grid):
        for p in sg.lattice.points:
            name = sg.symbol_set.symbols[solved_grid[p]].name
            if 'S' in name:
                self.solved_vertical_lines.add(p)
            if 'E' in name:
                self.solved_horizontal_lines.add(p)
