from re import match
from solvers.nurikabe import NurikabeSolver
from solvers.sudoku import SudokuSolver

SOLVERS = {
    'nurikabe': NurikabeSolver,
    'sudoku': SudokuSolver,
}


def solve(pzprv3: str):
    matched = match('pzprv3/([^/]+)/.*', pzprv3)
    puzzle_type = matched.group(1)
    return SOLVERS[puzzle_type](pzprv3).solve()
