from os import listdir, path
from typing import Optional

from grilops import SymbolGrid
from ruamel.yaml import YAML

from lib import GlobalTimeoutLock, Penpa, Puzzle
from solvers.abstract_solver import AbstractSolver

yaml = YAML()

# Dynamically import all py files in this directory
# https://stackoverflow.com/a/6246478
for py in [f[:-3] for f in listdir(path.dirname(__file__)) if f.endswith('.py') and f != '__init__.py']:
    __import__('.'.join([__name__, py]), fromlist=[py])


def puzzle_list():
    with open(path.join(path.dirname(__file__), '../supported_puzzles.yml')) as fh:
        return yaml.load(fh)


def solve(puzzle_type: str, url: str, parameters: str, different_from: Optional[str] = None):
    solver = next(subclass for subclass in AbstractSolver.__subclasses__()
                  if subclass.__name__ == ''.join(c for c in puzzle_type if c.isalpha()))()
    penpa = Penpa.from_url(url, parameters)
    sg: Optional[SymbolGrid] = None

    def init_symbol_grid(lattice, symbol_set):
        nonlocal sg
        sg = SymbolGrid(lattice, symbol_set)
        return sg

    with GlobalTimeoutLock(timeout=30):
        original = penpa.to_puzzle()
        solver.configure(original, init_symbol_grid)
        assert sg is not None, "init_symbol_grid not called by solver"
        sg.solver.set("timeout", 30000)
        if not sg.solve():
            if sg.solver.reason_unknown() == "timeout":
                raise TimeoutError(408)
            return None
        solution = Puzzle()
        solver.set_solved(original, sg, sg.solved_grid(), solution)
        solution = penpa.to_url(solution)
        if solution != different_from:
            return solution
        if sg.is_unique():
            return None
        solution = Puzzle()
        solver.set_solved(original, sg, sg.solved_grid(), solution)
        return penpa.to_url(solution)
