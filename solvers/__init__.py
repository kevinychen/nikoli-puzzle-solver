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
        'Fillomino',
        'm=edit&p=7VfdbuM2E73PUxACFkgAxpbkn9jqlTc/xQL5su0mxWJhBAElMTYRWnRJKm4UBMhD9LJ9uTzJDkeyLSlOiw9Ft70oZNGjM8OZ4Yx4aJufc6Y5HcE18KlPA7j6ILk79Md4O9xdV8JKHpEzIaVaiEyRfe+KW40yN94BneR2rnRETti9SMlEWlEIRefWLk3U7a5Wq85sscyLQnLTSdSiG0s164Z+GHb9Ufd27fYwfjhMnYdDVnro0kvLspTptBb7Uw5eIJQAQ07snJOZhqBMqmyGj6mylqdEiowbIjKriOYzoTJDEiYlaJZKPlS5E6NgDrMEHNuVaqhWws7RoWELTqBYjJg5fBGWEZ7OeId8yIzLwSjQJ1xK46xIli9irs13hLNkXj2RRW4s5LHU3PDMolv0qG5R3sQlwpKYu7UYYlWHTGqqBXsgicosExkpuFbvwmOiMo5fEEFB7MrdTNzzbJ1Ih+x/sEQY8GSMiCUnt2DOyMvzb3ORpjx7ef69FuXl+VdQbp9dGVRuYdUPO93jBCjyOjNG7pnMXWegrBA1U5aslw1qLKhl2gpoF3bO5FAmBrUjQ2cAsfFNKeuvMvlAgsMBScCn6Ry8C0/gc+YWkFu1YFYkUH+ZW2gwSeY8uQO/riIcZkPd9ycH8GrITbLYh5gTyIZreBcg4ExznrkpMYSoigmqStp/XzpwHYfXhS+ZhqCQe/1VWXtNNVtlG58d+vHsjN4yafjetNpL13uPxTgqJrT4Ppp6oUfxDrxrWvwYPRb/i4oLWlyCyqMBYOcgBR4NQTzdip9R76TjEgx8kC8qGcQvICZCJ5LfnJeGP0TT4op6Ls57nO1Eb6HuuVdOw2fYm7FwQMwsbHkzF8tKY/JU3eWVbXD9RIvJ2+n2tuk6sUzXSTvSdcn95XSxOXm8K9fx9dMT1PwTZHsTTV3iP23Fy+gRxovo0euN12sru+H1fQdAczZArw3021MGDuhvgQH66NWAoG1x1LIYoo9alOGwNeUIp9TCHo1aPkY4pQaMw5aPMa6lboE+6hZYj1oegY+LqcUNfPTSQLAkm1lQ2wAr/AXHMxxDHK+gAbTo4XiCo4/jAMdztDnF8TOOxzj2cRyizRGOo3Uz327yxqTW7789s6e9aTjEQ3V7Db7t8/Xe1DtWC2B9YTlsjYvyJLpQesGkB0TkAXHemFzfsgS2FfIUbB7ASrJsQFKppTtRG6CYZXDo7FQ50O3KHfax0mnL+woYtgGUv04aUEkQDchq2P21Z6a1WjUQOCDmDaBGbA1PcB40E4Ajqun7jrWiAfev03na837x8J6GNIQ+9P7j+X+C510H/D9n+38VL02LU3gxBiMaHPkeLT5Sb5nfsJtESQ9+LtApVB6YpKxhxbO7DP7fiTQMg9B/c75T90v1H6TnrIZg9a25taQupXeyF8BrArM634I7earCS6pqmL/iJBfuNS0BuoOZAG2TE0Cv+QnAVxQF2Bss5by2icpl1eYqF+oVXblQdcaaeps/XnAYIPgV',
        'm=edit&p=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',
    ),
    (
        'Sudoku',
        'm=edit&p=7VZdT8M2FH3vr5jy7IfYTpyPN8ZgL4yNwYRQVKG0BKhIG5a2Y0rV/865N+7ifEzTNE3jYUrrnp7Y9xxf+zrZ7p+qt71IcOlY+ELi0rHP3zigj2+vu9WuLNJvxNl+91rVAEL8eHkpnvNyW8wy22s+OzRJ2tyI5vs086QnPIWv9OaiuUkPzQ9pcy2aW9zyhAR31XZSgBcdvOf7hM5bUvrA1xYDPgAuV/WyLB6vWuanNGvuhEc63/Jogt66+q3wrA/6v6zWixURi3yHyWxfV+/2TpsG21fOj6I5a+1eTNjVnV2CrV1CE3ZpFv+y3WR+PCLtP8PwY5qR9186GHfwNj2gvU4PnoppaAgv7dp4KiFCd4RWREQdEUgijEMEp2ydiJCIxCHMQCUc9gi5R9wRZqgSjQiO4TiNfSICh9CDoPFoCE/fsZ7wEGe2SUQEtu6JkP7QiPS5j8tITpo7Sg69SMV9HLtScR/HjVScWidPUrGWk0qph6mTmtfQmYQMODV/xMHiS94CD9xecqu4vcMOEY3m9jtufW5Dbq+4zwU2joyNkAmEFCImiVA0ZWD8CqWQZ8IqFEojxYRxpqgQqSMcSqEMpkbYBEJFmBThKBIqgVXCCU4eHwmh+DHi+za+j/jSxpeITzuYtRCftibhAPFDGz9EfGPjG8SnXUIYp5qi1WYtDS2kkeOQf8srDWzjKMRx56VO/Q2wja8Q3/VDxcQY/rXV1dDV1qehPNh5Gegaq2ug6+bHWF0DXWN1DXTdeRmra6BrrK6BbkS6WLR7XrpzbgNuDS9pREfC3zo0/vnu+Us7GbJHzx/3Cr8WM59leMR526p83O7r53yJA5ufgDiTwW3260VR96iyqt7L1abfb/Wyqepi8haRxdPLVP9FVT8Non/kZdkjtr/u87o/uH309KhdjeeK8z+v6+qjx6zz3WuPcJ5BvUjFZtc3sMv7FvO3fKC27uZ8nHm/e/zNNN4f9P/vD//R+wMtgf/VDoSvZod3b1VPlj7oieoHO1nllh8VOvhRSZPguKrBThQ22GFtgxqXN8hRhYP7kyKnqMM6J1fDUiepUbWTlFvw2Xz2CQ==',
        'm=edit&p=7ZdNbxs3EIbv+hXCnnngDL91S1O7F9dtaheFIRjG2lZiIZI3XUlNsYb+e4ZcuhKpKdCiKJpDIYs7fpb7zsuPIVab3WP3cScCfZQXUgB9lJfp63X8k/lzvdyuFrOpeLPbPnU9BUL8cH4u3rerzWIyz71uJy9DmA3vxPDdbN5AIxqkLzS3Yng3exm+nw2XYriiW40AYhdjJ6Tw7BD+ku7H6O0IQVJ8mWMKbyh8WPYPq8XdxUh+nM2Ha9HEPN+kp2PYrLvfFk32Ef9/6Nb3ywju2y0NZvO0/JTvbNI0NK8p9mJ4M9o9Y+yqg131h13F28V/32643e9p2n8iw3ezefT+8yH0h/Bq9rKPvl4a9PFRQ17GtWkwRKAOQGEE7gA0RGCPgH6drVdgIghHwFZZTN3DpB7+AGydxZ0AUzn1MgJ9BFQl6k8e8ZX1oKrRBhcBHgDI2ghIVxPA+imovQBiZRdQVW4AdTVPgK6aSlD11IEK1SBAy0KHFh/SFrhJ7XlqMbXXtEPEoFL7bWplak1qL1KfM9o44K2AQImQFEMQGIdMMV0FohljNAKVH2M6U9DAGBsQaPUYWy3QuTF2TmCQYxzo5JFq1PekL7O+JH3I+kD6mPWR9HXW16Rvsr4hfZv1Len7rE+nGgaVcynKZbNO9J85KoqzDupyXPja31Kc9dGVfjDkmPyrnFdRXpV92jgPeVyW8tqc16pyfmzOaymvzXmtLcdlc15LeW3Oaymvi3n38WyKS/c2tTq1Ni2pi0cCHRoXsynBKS3ueL2kaxNNT9MmnaKYps00baL7adrvx1Al6EuoEwwlNAlCCW2CWECNCboSKq6nS1CV0DPmdWB8Gs1YMpym4TRNYCzZcepMCbkRWcdYsp57PDDz6SSj6ZAZkVOMeacZ8x44iMy6e8349Jax5B1jPnAzHwwz88Fyj3PLEbglBsmtB0hOFaRnXIEMnAJIxiwAMDMAoBm7ANz2AZTcKJDVRcOsDKDlnClkKbc1QHGLC7mAK7/KcR7UyUzGs0XmM+YqX2/idT+Z05kJ1cd8XeR2MqcX22bTre42u/59+0Cvaem9VyT2vFvfL/oCrbru02r5XPZbfnju+gV7K8LF4weu/33XP1bqn9vVqgCbX3dtXz48vnAWaNsvi//bvu8+F2Tdbp8KcPTmWSgtnrelgW1bWmw/tlW29WHM+0nze5O+c0W/GtT/vxr+o18NcQnk3/rt8M9fIv/CW8nXZSft3q5nS58wU/1E2SrP/KTQiZ+UdEx4WtVEmcImWtc2odPyJnhS4cT+pMijal3n0VVd6jHVSbXHVMcFTwfoFw=='
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
        solver.cells[Point(k // (solver.width + 4) - 2, k % (solver.width + 4) - 2)] = Content(value=v[0])

    def get_penpa():
        solver.to_standard_format(sg, sg.solved_grid())
        a = {
            'line': {},
            'lineE': {},
            'number': dict([(str((p.y + 2) * (solver.width + 4) + p.x + 2), [content.value, 2, '1'])
                            for p, content in solver.solved_cells.items()]),
            'squareframe': {},
            'surface': {},
            'symbol': {},
        }
        for p, content in solver.solved_vertical_borders.items():
            if content.black:
                start = (solver.width + 4) * (solver.height + 4) + (solver.width + 4) * (p.y + 1) + p.x + 2
                a['lineE'][f'{start},{start + solver.width + 4}'] = 2
        for p, content in solver.solved_horizontal_borders.items():
            if content.black:
                start = (solver.width + 4) * (solver.height + 4) + (solver.width + 4) * (p.y + 2) + p.x + 1
                a['lineE'][f'{start},{start + 1}'] = 2
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
