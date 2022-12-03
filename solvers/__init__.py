from base64 import b64decode, b64encode
from functools import reduce
from grilops import Point
from json import dumps, loads
from os import listdir, path
from threading import Condition, Lock
from time import time
from typing import Optional
from zlib import compress, decompress

from solvers.abstract_solver import AbstractSolver, Content

PUZZLES = [
    (
        'Sudoku',
        'm=edit&p=7VZdT8M2FH3vr5jy7IfYTpyPN8ZgL4yNwYRQVKG0BKhIG5a2Y0rV/865N+7ifEzTNE3jYUrrnp7Y9xxf+zrZ7p+qt71IcOlY+ELi0rHP3zigj2+vu9WuLNJvxNl+91rVAEL8eHkpnvNyW8wy22s+OzRJ2tyI5vs086QnPIWv9OaiuUkPzQ9pcy2aW9zyhAR31XZSgBcdvOf7hM5bUvrA1xYDPgAuV/WyLB6vWuanNGvuhEc63/Jogt66+q3wrA/6v6zWixURi3yHyWxfV+/2TpsG21fOj6I5a+1eTNjVnV2CrV1CE3ZpFv+y3WR+PCLtP8PwY5qR9186GHfwNj2gvU4PnoppaAgv7dp4KiFCd4RWREQdEUgijEMEp2ydiJCIxCHMQCUc9gi5R9wRZqgSjQiO4TiNfSICh9CDoPFoCE/fsZ7wEGe2SUQEtu6JkP7QiPS5j8tITpo7Sg69SMV9HLtScR/HjVScWidPUrGWk0qph6mTmtfQmYQMODV/xMHiS94CD9xecqu4vcMOEY3m9jtufW5Dbq+4zwU2joyNkAmEFCImiVA0ZWD8CqWQZ8IqFEojxYRxpqgQqSMcSqEMpkbYBEJFmBThKBIqgVXCCU4eHwmh+DHi+za+j/jSxpeITzuYtRCftibhAPFDGz9EfGPjG8SnXUIYp5qi1WYtDS2kkeOQf8srDWzjKMRx56VO/Q2wja8Q3/VDxcQY/rXV1dDV1qehPNh5Gegaq2ug6+bHWF0DXWN1DXTdeRmra6BrrK6BbkS6WLR7XrpzbgNuDS9pREfC3zo0/vnu+Us7GbJHzx/3Cr8WM59leMR526p83O7r53yJA5ufgDiTwW3260VR96iyqt7L1abfb/Wyqepi8haRxdPLVP9FVT8Non/kZdkjtr/u87o/uH309KhdjeeK8z+v6+qjx6zz3WuPcJ5BvUjFZtc3sMv7FvO3fKC27uZ8nHm/e/zNNN4f9P/vD//R+wMtgf/VDoSvZod3b1VPlj7oieoHO1nllh8VOvhRSZPguKrBThQ22GFtgxqXN8hRhYP7kyKnqMM6J1fDUiepUbWTlFvw2Xz2CQ==',
        'm=edit&p=7ZdNbxs3EIbv+hXCnnngDL91S1O7F9dtGhdFIBjG2lZiIZI3XUlNsYL+e4ZcuhKpKdCiKJpDIYsaP8t95+XHLLib3WP3cScCfZQXUgB9lJfp63X8k/lzs9yuFrOpeLXbPnU9BUL8cHkp3rerzWIyz71uJ/shzIY3YvhuNm+gEQ3SF5pbMbyZ7YfvZ8O1GN7SpUYAsauxE1J4cQx/Sddj9HqEICm+zjGF7yh8WPYPq8Xd1Uh+nM2HG9HEPN+ku2PYrLvfFk32Ef9/6Nb3ywju2y0NZvO0/JSvbNI0NC8pDmJ4Ndq9YOyqo131h13F28V/3264PRxo2n8iw3ezefT+8zH0x/DtbH+IvvYN+nirIS/j2jQYIlBHoDACdwQaIrAnQL/M1gswEYQTYKsspu5hUg9/BLbO4s6AqZx6GYE+AaoS9We3+Mp6UNVog4sAjwBkbQSkqwlgfRfUXgCxsguoKjeAuponQFdNJah66kCFahCgZaFDiw9pC7xL7WVqMbU3tEPEoFL7bWplak1qr1KfC9o44K2AQImQFEMQGIdMMf0KRDPGaAQqP8b0TEEDY2xAoNVjbLVA58bYOYFBjnGgJ49Uo74nfZn1JelD1gfSx6yPpK+zviZ9k/UN6dusb0nfZ316qmFQOZeiXDbrRP+Zo6I466Aux4Uv/S3FWR9d6QdDjsm/ynkV5VXZp43zkMdlKa/Nea0q58fmvJby2pzX2nJcNue1lNfmvJbyupj3EJ9Ncelep1an1qYldfGRQA+N69l030ST07QppyimafNMm+h2mvb3KVQJ+hLqBEMJTYJQQpsgFlBjgq6EiuvpElQl9Ix5HRifRjOWDKdpOE0TGEt2nDpTQm5E1jGWrOduD8x8OsloOmRG5BRj3mnGvAcOIrPuXjM+vWUseceYD9zMB8PMfLDc7dxyBG6JQXLrAZJTBekZVyADpwCSMQsAzAwAaMYuALd9ACU3CmR10TArA2g5ZwpZym0NUNziQi7gyq9ynAd1NpMHMaXzxnQff2X8PUzm9GyE6mO+LnI7mdMBttl0q7vNrn/fPtBxLJ1vRWLPu/X9oi/Qqus+rZbPZb/lh+euX7CXIlw8fuD633f9Y6X+uV2tCrD5ddf25c3jwbJA235Z/N/2ffe5IOt2+1SAkxNmobR43pYGtm1psf3YVtnWxzEfJs3vTfrOFb0dqP/fDv6jt4O4BPJvvSP888PiXzh9fF120u7terb0CTPVT5St8szPCp34WUnHhOdVTZQpbKJ1bRM6L2+CZxVO7E+KPKrWdR5d1aUeU51Ve0x1WvD0AP0C',
    ),
]

# https://stackoverflow.com/a/6246478
for py in [f[:-3] for f in listdir(path.dirname(__file__)) if f.endswith('.py') and f != '__init__.py']:
    __import__('.'.join([__name__, py]), fromlist=[py])

PENPA_PREFIX = 'm=edit&p='
# https://github.com/swaroopg92/penpa-edit/blob/v3.0.3/docs/js/class_p.js#L131-L162
PENPA_ABBREVIATIONS = [
    ["\"qa\"", "z9"],
    ["\"pu_q\"", "zQ"],
    ["\"pu_a\"", "zA"],
    ["\"grid\"", "zG"],
    ["\"edit_mode\"", "zM"],
    ["\"surface\"", "zS"],
    ["\"line\"", "zL"],
    ["\"lineE\"", "zE"],
    ["\"wall\"", "zW"],
    ["\"cage\"", "zC"],
    ["\"number\"", "zN"],
    ["\"symbol\"", "zY"],
    ["\"special\"", "zP"],
    ["\"board\"", "zB"],
    ["\"command_redo\"", "zR"],
    ["\"command_undo\"", "zU"],
    ["\"command_replay\"", "z8"],
    ["\"numberS\"", "z1"],
    ["\"freeline\"", "zF"],
    ["\"freelineE\"", "z2"],
    ["\"thermo\"", "zT"],
    ["\"arrows\"", "z3"],
    ["\"direction\"", "zD"],
    ["\"squareframe\"", "z0"],
    ["\"polygon\"", "z5"],
    ["\"deletelineE\"", "z4"],
    ["\"killercages\"", "z6"],
    ["\"nobulbthermo\"", "z7"],
    ["\"__a\"", "z_"],
    ["null", "zO"],
]


def puzzle_list():
    return [{'type': puzzle[0], 'demo': puzzle[1]} for puzzle in PUZZLES]


def solve(puzzle_type: str, penpa: str, different_from: Optional[str] = None):
    solver = next(subclass for subclass in AbstractSolver.__subclasses__()
                  if subclass.__name__ == ''.join(c for c in puzzle_type if c.isalpha()))()
    parts = decompress(b64decode(penpa[len(PENPA_PREFIX):]), -15).decode().split('\n')
    header = parts[0].split(',')
    q = loads(reduce(lambda s, abbr: s.replace(abbr[1], abbr[0]), PENPA_ABBREVIATIONS, parts[3]))

    solver.width = int(header[1])
    solver.height = int(header[2])
    solver.cells = dict()
    for k, v in q['number'].items():
        k = int(k)
        solver.cells[Point(k // 13 - 2, k % 13 - 2)] = Content(value=v[0])

    def get_penpa():
        solver.to_standard_format(sg, sg.solved_grid())
        a = {
            'number': dict([(str((p.y + 2) * 13 + p.x + 2), [content.value, 2, '1'])
                            for p, content in solver.solved_cells.items()]),
            'surface': {},
            'squareframe': {},
        }
        parts[4] = reduce(lambda s, abbr: s.replace(abbr[0], abbr[1]), PENPA_ABBREVIATIONS, dumps(a))
        return PENPA_PREFIX + b64encode(compress('\n'.join(parts).encode())[2:-4]).decode()

    with GlobalTimeoutLock(timeout=30):
        sg = solver.configure()
        sg.solver.set("timeout", 30000)
        if not sg.solve():
            if sg.solver.reason_unknown() == "timeout":
                raise TimeoutError(408)
            return None
        penpa = get_penpa()
        if penpa != different_from:
            return penpa
        if sg.is_unique():
            return None
        return get_penpa()


class GlobalTimeoutLock:

    _lock = Lock()
    _cond = Condition(Lock())

    def __init__(self, timeout):
        self.timeout = timeout

    def __enter__(self):
        with GlobalTimeoutLock._cond:
            current_time = time()
            stop_time = current_time + self.timeout
            while current_time < stop_time:
                if GlobalTimeoutLock._lock.acquire(False):
                    return self
                else:
                    GlobalTimeoutLock._cond.wait(stop_time - current_time)
                    current_time = time()
            raise TimeoutError(503)

    def __exit__(self, exc_type, exc_val, exc_tb):
        with GlobalTimeoutLock._cond:
            GlobalTimeoutLock._lock.release()
            GlobalTimeoutLock._cond.notify()
