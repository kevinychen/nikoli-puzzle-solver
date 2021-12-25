from re import match
from solvers.lits import LITSSolver
from solvers.masyu import MasyuSolver
from solvers.nurikabe import NurikabeSolver
from solvers.skyscrapers import SkyscrapersSolver
from solvers.slitherlink import SlitherlinkSolver
from solvers.starbattle import StarBattleSolver
from solvers.sudoku import SudokuSolver

SOLVERS = {
    'lits': LITSSolver,
    'mashu': MasyuSolver,
    'nurikabe': NurikabeSolver,
    'skyscrapers': SkyscrapersSolver,
    'slither': SlitherlinkSolver,
    'starbattle': StarBattleSolver,
    'sudoku': SudokuSolver,
}


def solve(pzprv3: str):
    matched = match('pzprv3[^/]*/([^/]+)/.*', pzprv3)
    puzzle_type = matched.group(1)
    return SOLVERS[puzzle_type](pzprv3).solve()
