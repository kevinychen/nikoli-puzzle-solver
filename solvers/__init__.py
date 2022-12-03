from base64 import b64decode, b64encode
from functools import reduce
from json import dumps, loads
from typing import Optional
from zlib import compress, decompress

from solvers.aquarium import AquariumSolver
from solvers.balanceloop import BalanceLoopSolver
from solvers.castlewall import CastleWallSolver
from solvers.cave import CaveSolver
from solvers.easyasabc import EasyAsAbcSolver
from solvers.fillomino import FillominoSolver
from solvers.hashiwokakero import HashiwokakeroSolver
from solvers.heteromino import HeterominoSolver
from solvers.heyawake import HeyawakeSolver
from solvers.hitori import HitoriSolver
from solvers.kakuro import KakuroSolver
from solvers.kropki import KropkiSolver
from solvers.lightup import LightUpSolver
from solvers.lits import LITSSolver
from solvers.masyu import MasyuSolver
from solvers.meanderingnumbers import MeanderingNumbersSolver
from solvers.minesweeper import MinesweeperSolver
from solvers.nonogram import NonogramSolver
from solvers.numberlink import NumberlinkSolver
from solvers.nurikabe import NurikabeSolver
from solvers.shakashaka import ShakashakaSolver
from solvers.shikaku import ShikakuSolver
from solvers.simpleloop import SimpleLoopSolver
from solvers.skyscrapers import SkyscrapersSolver
from solvers.slitherlink import SlitherlinkSolver
from solvers.starbattle import StarBattleSolver
from solvers.sudoku import SudokuSolver
from solvers.tapa import TapaSolver
from solvers.tapalikeloop import TapaLikeLoopSolver
from solvers.tentaisho import TentaishoSolver
from solvers.tents import TentsSolver
from solvers.yajilin import YajilinSolver
from solvers.yinyang import YinYangSolver

PUZZLES = [
    ('sudoku', "Sudoku", SudokuSolver),
]

DEMOS = [
    (
        'sudoku',
        'm=edit&p=7VZdT8M2FH3vr5jy7IfYTpyPN8ZgL4yNwYRQVKG0BKhIG5a2Y0rV/865N+7ifEzTNE3jYUrrnp7Y9xxf+zrZ7p+qt71IcOlY+ELi0'
        'rHP3zigj2+vu9WuLNJvxNl+91rVAEL8eHkpnvNyW8wy22s+OzRJ2tyI5vs086QnPIWv9OaiuUkPzQ9pcy2aW9zyhAR31XZSgBcdvOf7hM5bUvr'
        'A1xYDPgAuV/WyLB6vWuanNGvuhEc63/Jogt66+q3wrA/6v6zWixURi3yHyWxfV+/2TpsG21fOj6I5a+1eTNjVnV2CrV1CE3ZpFv+y3WR+PCLtP'
        '8PwY5qR9186GHfwNj2gvU4PnoppaAgv7dp4KiFCd4RWREQdEUgijEMEp2ydiJCIxCHMQCUc9gi5R9wRZqgSjQiO4TiNfSICh9CDoPFoCE/fsZ7'
        'wEGe2SUQEtu6JkP7QiPS5j8tITpo7Sg69SMV9HLtScR/HjVScWidPUrGWk0qph6mTmtfQmYQMODV/xMHiS94CD9xecqu4vcMOEY3m9jtufW5Db'
        'q+4zwU2joyNkAmEFCImiVA0ZWD8CqWQZ8IqFEojxYRxpqgQqSMcSqEMpkbYBEJFmBThKBIqgVXCCU4eHwmh+DHi+za+j/jSxpeITzuYtRCftib'
        'hAPFDGz9EfGPjG8SnXUIYp5qi1WYtDS2kkeOQf8srDWzjKMRx56VO/Q2wja8Q3/VDxcQY/rXV1dDV1qehPNh5Gegaq2ug6+bHWF0DXWN1DXTde'
        'Rmra6BrrK6BbkS6WLR7XrpzbgNuDS9pREfC3zo0/vnu+Us7GbJHzx/3Cr8WM59leMR526p83O7r53yJA5ufgDiTwW3260VR96iyqt7L1abfb/W'
        'yqepi8haRxdPLVP9FVT8Non/kZdkjtr/u87o/uH309KhdjeeK8z+v6+qjx6zz3WuPcJ5BvUjFZtc3sMv7FvO3fKC27uZ8nHm/e/zNNN4f9P/vD'
        '//R+wMtgf/VDoSvZod3b1VPlj7oieoHO1nllh8VOvhRSZPguKrBThQ22GFtgxqXN8hRhYP7kyKnqMM6J1fDUiepUbWTlFvw2Xz2CQ==',
        '',
    ),
]

PENPA_PREFIX = 'm=edit&p='
PENPA_ABBREVIATIONS = [
    ('"qa"', 'z9'),
    ('"pu_q"', 'zQ'),
    ('"pu_a"', 'zA'),
    ('"grid"', 'zG'),
    ('"edit_mode"', 'zM'),
    ('"surface"', 'zS'),
    ('"line"', 'zL'),
    ('"lineE"', 'zE'),
    ('"wall"', 'zW'),
    ('"cage"', 'zC'),
    ('"number"', 'zN'),
    ('"symbol"', 'zY'),
    ('"special"', 'zP'),
    ('"board"', 'zB'),
    ('"command_redo"', 'zR'),
    ('"command_undo"', 'zU'),
    ('"command_replay"', 'z8'),
    ('"numberS"', 'z1'),
    ('"freeline"', 'zF'),
    ('"freelineE"', 'z2'),
    ('"thermo"', 'zT'),
    ('"arrows"', 'z3'),
    ('"direction"', 'zD'),
    ('"squareframe"', 'z0'),
    ('"polygon"', 'z5'),
    ('"deletelineE"', 'z4'),
    ('"killercages"', 'z6'),
    ('"nobulbthermo"', 'z7'),
    ('"__a"', 'z_'),
    ('"null', 'zO'),
]


def get_demo(puzzle_type):
    return next(demo for demo in DEMOS if demo[0] == puzzle_type)


def puzzle_list():
    return [{'type': puzzle[0], 'name': puzzle[1], 'demo': get_demo(puzzle[0])[1]} for puzzle in PUZZLES]


def solve(puzzle_type: str, penpa: str, different_from: Optional[str] = None):
    parts = decompress(b64decode(penpa[len(PENPA_PREFIX):]), -15).decode().split('\n')
    puzzle = {
        'header': parts[0].split(','),
        'q': loads(reduce(lambda s, abbr: s.replace(abbr[1], abbr[0]), PENPA_ABBREVIATIONS, parts[3])),
    }
    a = next(puzzle[2] for puzzle in PUZZLES if puzzle[0] == puzzle_type)(puzzle).solve(different_from)
    parts[4] = reduce(lambda s, abbr: s.replace(abbr[0], abbr[1]), PENPA_ABBREVIATIONS, dumps(a))
    return PENPA_PREFIX + b64encode(compress('\n'.join(parts).encode())[2:-4]).decode()
