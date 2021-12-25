from re import match
from solvers.fillomino import FillominoSolver
from solvers.lits import LITSSolver
from solvers.masyu import MasyuSolver
from solvers.nurikabe import NurikabeSolver
from solvers.skyscrapers import SkyscrapersSolver
from solvers.slitherlink import SlitherlinkSolver
from solvers.starbattle import StarBattleSolver
from solvers.sudoku import SudokuSolver

SOLVERS = [
    ('fillomino', "Fillomino", FillominoSolver),
    ('lits', "LITS", LITSSolver),
    ('mashu', "Masyu", MasyuSolver),
    ('nurikabe', "Nurikabe", NurikabeSolver),
    ('skyscrapers', "Skyscrapers", SkyscrapersSolver),
    ('slither', "Slitherlink", SlitherlinkSolver),
    ('starbattle', "Star Battle", StarBattleSolver),
    ('sudoku', "Sudoku", SudokuSolver),
]


def puzzle_list():
    return [{'type': solver[0], 'name': solver[1]} for solver in SOLVERS]


def solve(pzprv3: str):
    matched = match('pzprv3[^/]*/([^/]+)/.*', pzprv3)
    puzzle_type = matched.group(1)
    return next(solver[2] for solver in SOLVERS if solver[0] == puzzle_type)(pzprv3).solve()
