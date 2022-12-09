from solvers.utils import *


class Masyu(AbstractSolver):

    def configure(self, puzzle, init_symbol_grid):
        lattice = grilops.get_rectangle_lattice(puzzle.height, puzzle.width)
        symbol_set = LoopSymbolSet(lattice)
        symbol_set.append('empty')

        sg = init_symbol_grid(lattice, symbol_set)
        lc = LoopConstrainer(sg, single_loop=True)

        circles = [p for p in puzzle.symbols if puzzle.symbols[p].is_circle()]
        for p in circles:
            if puzzle.symbols[p].is_black():
                sg.solver.add(sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.NE, symbol_set.SW, symbol_set.SE]))
                if p.x > 0:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.SW]),
                        sg.cell_is(Point(p.y, p.x - 1), symbol_set.EW)))
                if p.x < puzzle.width - 1:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NE, symbol_set.SE]),
                        sg.cell_is(Point(p.y, p.x + 1), symbol_set.EW)))
                if p.y > 0:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.NW, symbol_set.NE]),
                        sg.cell_is(Point(p.y - 1, p.x), symbol_set.NS)))
                if p.y < puzzle.height - 1:
                    sg.solver.add(Implies(
                        sg.cell_is_one_of(p, [symbol_set.SW, symbol_set.SE]),
                        sg.cell_is(Point(p.y + 1, p.x), symbol_set.NS)))
            else:
                choices = []
                if 0 < p.x < puzzle.width - 1:
                    choices.append(And(sg.cell_is(p, symbol_set.EW), Or(
                        sg.cell_is_one_of(Point(p.y, p.x - 1), [symbol_set.NE, symbol_set.SE]),
                        sg.cell_is_one_of(Point(p.y, p.x + 1), [symbol_set.NW, symbol_set.SW]))))
                if 0 < p.y < puzzle.height - 1:
                    choices.append(And(sg.cell_is(p, symbol_set.NS), Or(
                        sg.cell_is_one_of(Point(p.y - 1, p.x), [symbol_set.SW, symbol_set.SE]),
                        sg.cell_is_one_of(Point(p.y + 1, p.x), [symbol_set.NW, symbol_set.NE]))))
                sg.solver.add(Or(*choices))

        # Optimization: loop starts at one of the circles
        if circles:
            sg.solver.add(lc.loop_order_grid[circles[0]] == 0)

    def set_solved(self, puzzle, sg, solved_grid, solution):
        solution.set_loop(sg, solved_grid)
