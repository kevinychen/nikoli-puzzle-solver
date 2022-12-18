from os import listdir, path
from typing import Dict, List, Optional, Tuple

from grilops import Point, SymbolGrid
from ruamel.yaml import YAML

from lib import GlobalTimeoutLock, Penpa, Solution
from solvers.abstract_solver import AbstractSolver

yaml = YAML()

# Dynamically import all py files in this directory
# https://stackoverflow.com/a/6246478
for py in [f[:-3] for f in listdir(path.dirname(__file__)) if f.endswith(".py") and f != "__init__.py"]:
    __import__(".".join([__name__, py]), fromlist=[py])


def puzzle_list():
    with open(path.join(path.dirname(__file__), "../supported_puzzles.yml")) as fh:
        return yaml.load(fh)


def solve(puzzle_type: str, url: str, parameters: str, different_from: Optional[List[Tuple[Point, int]]] = None):
    solver = next(
        subclass
        for subclass in AbstractSolver.__subclasses__()
        if subclass.__name__ == "".join(c for c in puzzle_type if c.isalpha())
    )()
    penpa = Penpa.from_url(url, parameters)
    solved_grid: Optional[Dict[Point, int]] = None
    solution = Solution()

    def _solve(sg: SymbolGrid):
        nonlocal solved_grid, solution

        if different_from:
            for p, value in different_from:
                sg.solver.add(sg.grid[Point(*p)] != value)

        sg.solver.set("timeout", 300000)
        if not sg.solve():
            if sg.solver.reason_unknown() == "timeout":
                raise TimeoutError(408)
            raise RuntimeError

        solved_grid = sg.solved_grid()
        return solved_grid, solution

    with GlobalTimeoutLock(timeout=30):
        original = penpa.to_puzzle()
        try:
            solver.run(original, _solve)
            return penpa.to_url(solution), list(solved_grid.items())
        except RuntimeError:
            return None, None
