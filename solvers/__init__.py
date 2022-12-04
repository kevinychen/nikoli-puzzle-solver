from base64 import b64decode, b64encode
from functools import reduce
from grilops import Point
from json import dumps, loads
from os import listdir, path
from threading import Condition, Lock
from time import time
from typing import Optional
from zlib import compress, decompress

from solvers.abstract_solver import AbstractSolver, Symbol

PUZZLES = [
    (
        'Fillomino',
        'm=edit&p=7VVdb9s2FH33ryAIFNgAJpZkO1n01iX19pDEa5OhKAwjoCRaIkyJHj+mREH+ey8pZ5Zkt2hftj4MtK6vD+/HochD678sVYzMYExnJCAhjOg88M/Uf17HPTeCxeiG6ieLfsKLLEOLimm0sAb/TN5aU0gVo7liWcYZ+p1WGSmM2ep4PK7r+jQvt7ZpBNOnqSzHiZD5OAqiaBwG49KVPEmeTtZt8kkByWNyZ+CLqmzX8oOF5BhdKVojijSvcsHeRJeoktUJrwxTmqUGUCSk3CJTUIO2VGtgaAolbV4gKgRKuUoFy1DKhNCn6L5gbXxptUG5RNooyvPC/JNkIMIHo5qbAtUFNwD4Ktq19yhFxqoK8QpBV8Eo1JIVQ3LdSedlyTJODRNPKGFrqdiYroE2YjTt1x3SKumGdVvAMlzZRNB006WSWIgdrgMSEgkUv4VEt+Lpm+gKPnOpELVGltTwFGkprOGyQmnB0g28bNfWcdmTTRjKYIs801wxVu0KkcV8TtZUaDZa7o7UavTcXMTNe9L8Fi9xhIl/Qrwizfv4ubmJm1vS3MEUJiFg1+CFmEzAfde6Ebgf/bwDL9vIANzbdt5lfQK3XdHDTYv8ES+be4Jdm199inNxKf9muE3zv+GUJtwBCTVw8HXBt7sZbTO5sbvYcPVCmree7S7l65Sd+zXKbkkdytct8p2UBa/Y4zG2F6uXF3jpH4DvQ7x01P/cu7/s3bv4Gext/IyjqUuFfQnbncGT4HXlr0A4iJheDIDZmQNmHeDcAWd74MwXnbwC0Dv0DD55O/c28vYeCJJm4u2Vt4G3M2+vfcw7bz96e+nt1NszH3PulvhdL+FfoLOM2qvXjdm3eavREl/Kcis13BwYtIRBnQ/aqjVN4Vh4qcH2A1bZMmGqBzm9ulOCY6PsDuN5BffBfmYQzrK8D7bxiVTZoHgNN1QPaP9kelB7vnuQUXB4O7+pUrLuIXAJFT2go81eJVaZPgFD+xTphg66lfs1v4zwI/bPcgL31OT/e+o/uafcBgQ/mlB/NDr+7Ep1VPcAH5E+oEc1vsMPZA74gaBdw0NNA3pE1oAOlQ3QobgBPNA3YF+QuKs6VLljNRS6a3WgddeqK/flavQZ',
        'm=edit&p=7VXdj5s4EH/PX2FZqtSTvBswyW7hrd1t7h7249rdqlpF0cqAE1AA52zTdInyv9/YEAJJete+3PWhIgyen+fjN4aZqL9KJjkZwzUaE4e4cNFLx94j+9tdj6nOeIBumXop0Wt8H8fovuAK3Zca/0beljoRMkATyeM45egPVsQk0XqlguFwvV6fL/JVWVUZV+eRyIdhJhZD6lA6dJ1hbkKehS9n89r5LAHnIXnQ8GAyblJ+LME5QNeSrRFDKi0WGX9Fr1AhirO00FwqHmlAUSbECumEabRiSgFDnUhRLhLEsgxFqYwyHqOIZ5k6R48Jr+3zUmm0EEhpydJFolsnDRbWGK1TnaB1kmreRFEmvUUZ0qUsUFogyJpxBrFEwZGYd9zTPOdxyjTPXlDI50LyIZsDbcRZ1I97SCtnS95NAWWYsGHGomWXSljq4zrAIRRA8XtIdCOev6LX8JsIiVipRc50GiElslKnokBRwqMlHLZJq3tkQ45ieEWW6UJyXjSByP1kQuYsU3wwbT6p2WBT+UH1gVS/B1NMMbG3i2ek+hBsqtuguiPVA2xh4gJ2AysXEw+W7+slheVnu2/Aq9rSgeVdvW+8nmBZV/R8WyN/BtPqkWCT5p11MUuciy8c125Wh680TA0QMg0fvkrSVbOjylgsS7xLsSXVW8u2cflnyt6/UKZ9yjc18oOUs7TgX0+x9WfbLRz6R+D7HEwN9U/75Zv98iHYbA2lDaYjXL8bt34z2HN2le8A98Bi5B8A4wsDjDvApQEu9sCFDertAMjtWgZPVk6spFY+AkFSeVZeW+lYObbyxtq8t/KzlVdWjqy8sDaXpkQ4hJsAAYjAGm2w78FboDhAlCDsOqC5rUbfENe73GkeTMiR01pSsHQbzR9DkNFuy/UJuLYahKS7kP4IDL02PsTw3NYQNNpqDmRz22wUNG+fG6K4XtdyX4HrdiuwVJxuPdRv95xOBbbyTgnmHFqNOj1mfo+Zv2NmjvSuOVqneT40zyfz3A6mtP6fMdf4+1azwRRfiXwlFIxJDIMDwyh6VqWcswh6wM4VYrGizEMue5AZTqYlcKBl2WDpooDht985MOfxog/W9qGQ8UHwNYzjHqDsP2oPqpu5B2mZ9nQmpVj3EJi4SQ/oDKJeJF7oPgHN+hTZkh1ky/c1bwf4K7b31IOh7P0ayv/LUDYvwPmh0fyfDMmfi479doU82fcAn2h9QE/2eIMftTngRw1tEh73NKAn2hrQw84G6Li5ATzqb8C+0eIm6mGXG1aHjW5SHfW6SdVt9+ls8Dc=',
    ),
    (
        'Masyu',
        'm=edit&p=7VVdb9s2FH33ryAIFNgAJrKUeEn11iX19pDUa5OhCAQjoCRaIkyJHj+mRkH+ey8pbZZkr+gGDOvDQOv6+vB+HIo8tP7NUsXIAsb5gsxJCCO6mPvn3H/+GPfcCBajW6qfLPoOr/IcrWqm0coa/D15Y00pVYyWiuU5Z+hnWuekNGan4yBomua0qHa2bQXTp5msglTIIojmURSE86ByJU/Sp5NNl3xSQnJA7gx8UZX3LT9YSI7RtaINokjzuhDsVXSFalmf8NowpVlmAEVCyh0yJTVoR7UGhqZU0hYlokKgjKtMsBxlTAh9iu5L1sVXVhtUSKSNorwozZ9JBiJ8MGq4KVFTcgOAr6Jde49SZKyqEa8RdBWMQi1ZMyQ3g3ReVSzn1DDxhFK2kYoFdAO0EaPZuO6UVkW3bNgCluHKpoJm2yGV1ELsdB2QkEqg+DUkhhVPX0XX8FlKhag1sqKGZ0hLYQ2XNcpKlm3hZbu2jsuebMpQDlvkmRaKsbovRFbLJdlQodks6Y/Uevbcvo7b96T9KU5whIl/Qrwm7fv4ub2N2wfS3sEUJiFgN+CFmJyB+7ZzI3A/+nkHXnWRc3DfdfMu6wHcbkWPtx3yS5y09wS7Nj/6FOfiSv7OcJfmf8MpTbkDUmrg4OuS7/oZbXO5tX1suH4h7RvPtk/5MmXnfomyW9KA8k2H/E3Kgtfs0zG2r9cvL/DSPwDfxzhx1H/du5d79y5+BvvO29Dbh/gZRyGUiaDP8HXi8+goegHo5RRdXB6iUHzpW0Te3gMD0p55e+3t3NuFtzc+5q23H7298vbc2x98zIVbwz9e5b9EJ4m6u9WNxdd561mCr2S1kxquBgxiwSC/R23Vhmaw715LsL+A1bZKmRpBTpDuGODYKNtjvKhB8PuZSTjLizHYxadS5ZPiDVxBI6D7FxlB3RaPIKPgdA5+U6VkM0LglilHwEB8o0qsNmMCho4p0i2ddKv2a36Z4U/YP8kZXERn/19E/8lF5DZg/q0J9Vuj48+uVEd1D/AR6QN6VOM9fiBzwA8E7RoeahrQI7IGdKpsgA7FDeCBvgH7C4m7qlOVO1ZTobtWB1p3rYZyT9azzw==',
        'm=edit&p=7VVdb9s2FH33ryAIFNgAJpYoK3H01iX19pA0a5OhCAwjoCTaIiyJHknVjQz/911SUm3Z3tYWKLqHQdbl9dH9OJR5rvWfFVOchHCNQuIRHy566bl75D7d9ShMziN0x/RLhX7C92mK7kuu0X1l8M/kdWUyqSI0UTxNBUe/sTIlmTErHQ2H6/X6fFGsqrrOuT5PZDGMc7kYUo/Soe8NC1vyLH45mzfJZxkkD8mDgYWptG35voLkCN0otkYMaVEucv6KXqNSlmeiNFxpnhhAUS7lCpmMGbRiWgNDkylZLTLE8hwlQiU5T1HC81yfo8eMN/FFpQ1aSKSNYmKRmc9JBiJcMFoLk6F1Jgxvq2jb3qEMmUqVSJQIuuacQS1ZciTne+miKHgqmOH5C4r5XCo+ZHOgjThL+nUPaRVsyfdbwDZs2ThnyXKfSlyZ431AQiyB4peQ2K94/orewGciFWKVkQUzIkFa5pURskRJxpMlvGzb1vTIxhyl8BM5pgvFedkWIveTCZmzXPPBtD1Ss8Gmvorqd6T+NZpiiom7fTwj9btoU99F9ROpH+ARJj5gt+D5mATgvmlcCu4H99yC102kB+7b5rnNegK32dHzXYP8Hk3rR4Jtm19cinVxIT9y3KS573BKY2GBmBk4+DoTq/aJrlK5rHDXYkvq145tm/LPlIN/oUz7lG8b5Csp56Lkn06xvZptt/DS3wPf52hqqf+xc8c79yHabC0la31nn6INpj6UoaT/OvGInkQvAR0fouH4GIXiE9eCOvsIDEgdOHvjrOds6Oyti3nj7Adnr50dOXvhYi7tHmCXtxGynEng4QhRgjAdkSBo/cAjwVXnj4ml2/gBsRty/uiShBetH3ok7OLtXOx8qE+7+PCChF0dGhA62tX/3Csc79Xxd70oJTTYq+93/hUJO/4h8Blbf0sQvAO0sevbdvXa9aFdn+y6HUxpM9PtFX6ZNxtM8bUsVlLDSMIgUgyyf9aVmrMEzpvTMHFYWRUxVz3IDgJ7/HBkVNViYlHCoNk9OQjn6aIPNvGxVOlB8TWMvh6g3b9XD2qOVg8ySvS+M6XkuofAdMt6wJ7oe5V4afoEDOtTZEt20K3Y7Xk7wJ+wu6cBDMDg/wH4Qwag/QG8bx6D321e/bfouLMr1UndA3xC+oCe1HiLH8kc8CNB24bHmgb0hKwBPVQ2QMfiBvBI34D9jcRt1UOVW1aHQretjrRuW+3LfTob/AU=',
    ),
    (
        'Sudoku',
        'm=edit&p=7VZdT8M2FH3vr5jy7IfYTpyPN8ZgL4yNwYRQVKG0BKhIG5a2Y0rV/865N+7ifEzTNE3jYUrrnp7Y9xxf+zrZ7p+qt71IcOlY+ELi0rHP3zigj2+vu9WuLNJvxNl+91rVAEL8eHkpnvNyW8wy22s+OzRJ2tyI5vs086QnPIWv9OaiuUkPzQ9pcy2aW9zyhAR31XZSgBcdvOf7hM5bUvrA1xYDPgAuV/WyLB6vWuanNGvuhEc63/Jogt66+q3wrA/6v6zWixURi3yHyWxfV+/2TpsG21fOj6I5a+1eTNjVnV2CrV1CE3ZpFv+y3WR+PCLtP8PwY5qR9186GHfwNj2gvU4PnoppaAgv7dp4KiFCd4RWREQdEUgijEMEp2ydiJCIxCHMQCUc9gi5R9wRZqgSjQiO4TiNfSICh9CDoPFoCE/fsZ7wEGe2SUQEtu6JkP7QiPS5j8tITpo7Sg69SMV9HLtScR/HjVScWidPUrGWk0qph6mTmtfQmYQMODV/xMHiS94CD9xecqu4vcMOEY3m9jtufW5Dbq+4zwU2joyNkAmEFCImiVA0ZWD8CqWQZ8IqFEojxYRxpqgQqSMcSqEMpkbYBEJFmBThKBIqgVXCCU4eHwmh+DHi+za+j/jSxpeITzuYtRCftibhAPFDGz9EfGPjG8SnXUIYp5qi1WYtDS2kkeOQf8srDWzjKMRx56VO/Q2wja8Q3/VDxcQY/rXV1dDV1qehPNh5Gegaq2ug6+bHWF0DXWN1DXTdeRmra6BrrK6BbkS6WLR7XrpzbgNuDS9pREfC3zo0/vnu+Us7GbJHzx/3Cr8WM59leMR526p83O7r53yJA5ufgDiTwW3260VR96iyqt7L1abfb/Wyqepi8haRxdPLVP9FVT8Non/kZdkjtr/u87o/uH309KhdjeeK8z+v6+qjx6zz3WuPcJ5BvUjFZtc3sMv7FvO3fKC27uZ8nHm/e/zNNN4f9P/vD//R+wMtgf/VDoSvZod3b1VPlj7oieoHO1nllh8VOvhRSZPguKrBThQ22GFtgxqXN8hRhYP7kyKnqMM6J1fDUiepUbWTlFvw2Xz2CQ==',
        'm=edit&p=7ZdNbxs3EIbv+hXCnnngDL91S1O7F9dtaheFIRjG2lZiIZI3XUlNsYb+e4ZcuhKpKdCiKJpDIYs7fpb7zsuPIVab3WP3cScCfZQXUgB9lJfp63X8k/lzvdyuFrOpeLPbPnU9BUL8cH4u3rerzWIyz71uJy9DmA3vxPDdbN5AIxqkLzS3Yng3exm+nw2XYriiW40AYhdjJ6Tw7BD+ku7H6O0IQVJ8mWMKbyh8WPYPq8XdxUh+nM2Ha9HEPN+kp2PYrLvfFk32Ef9/6Nb3ywju2y0NZvO0/JTvbNI0NK8p9mJ4M9o9Y+yqg131h13F28V/32643e9p2n8iw3ezefT+8yH0h/Bq9rKPvl4a9PFRQ17GtWkwRKAOQGEE7gA0RGCPgH6drVdgIghHwFZZTN3DpB7+AGydxZ0AUzn1MgJ9BFQl6k8e8ZX1oKrRBhcBHgDI2ghIVxPA+imovQBiZRdQVW4AdTVPgK6aSlD11IEK1SBAy0KHFh/SFrhJ7XlqMbXXtEPEoFL7bWplak1qL1KfM9o44K2AQImQFEMQGIdMMV0FohljNAKVH2M6U9DAGBsQaPUYWy3QuTF2TmCQYxzo5JFq1PekL7O+JH3I+kD6mPWR9HXW16Rvsr4hfZv1Len7rE+nGgaVcynKZbNO9J85KoqzDupyXPja31Kc9dGVfjDkmPyrnFdRXpV92jgPeVyW8tqc16pyfmzOaymvzXmtLcdlc15LeW3Oaymvi3n38WyKS/c2tTq1Ni2pi0cCHRoXsynBKS3ueL2kaxNNT9MmnaKYps00baL7adrvx1Al6EuoEwwlNAlCCW2CWECNCboSKq6nS1CV0DPmdWB8Gs1YMpym4TRNYCzZcepMCbkRWcdYsp57PDDz6SSj6ZAZkVOMeacZ8x44iMy6e8349Jax5B1jPnAzHwwz88Fyj3PLEbglBsmtB0hOFaRnXIEMnAJIxiwAMDMAoBm7ANz2AZTcKJDVRcOsDKDlnClkKbc1QHGLC7mAK7/KcR7UyUzGs0XmM+YqX2/idT+Z05kJ1cd8XeR2MqcX22bTre42u/59+0Cvaem9VyT2vFvfL/oCrbru02r5XPZbfnju+gV7K8LF4weu/33XP1bqn9vVqgCbX3dtXz48vnAWaNsvi//bvu8+F2Tdbp8KcPTmWSgtnrelgW1bWmw/tlW29WHM+0nze5O+c0W/GtT/vxr+o18NcQnk3/rt8M9fIv/CW8nXZSft3q5nS58wU/1E2SrP/KTQiZ+UdEx4WtVEmcImWtc2odPyJnhS4cT+pMijal3n0VVd6jHVSbXHVMcFTwfoFw==',
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
    solver.symbols = {}
    solver.texts = {}
    for k, (text, _, _) in q['number'].items():
        solver.texts[Point(int(k) // (solver.width + 4) - 2, int(k) % (solver.width + 4) - 2)] = text
    for k, (style, shape, _) in q['symbol'].items():
        solver.symbols[Point(int(k) // (solver.width + 4) - 2, int(k) % (solver.width + 4) - 2)] = Symbol(style, shape)

    def get_penpa():
        solver.solved_texts = {}
        solver.solved_vertical_lines = set()
        solver.solved_horizontal_lines = set()
        solver.solved_vertical_borders = set()
        solver.solved_horizontal_borders = set()
        solver.to_standard_format(sg, sg.solved_grid())

        line = {}
        for p in solver.solved_vertical_lines:
            start = (solver.width + 4) * (p.y + 2) + p.x + 2
            line[f'{start},{start + solver.width + 4}'] = 2
        for p in solver.solved_horizontal_lines:
            start = (solver.width + 4) * (p.y + 2) + p.x + 2
            line[f'{start},{start + 1}'] = 2
        lineE = {}
        for p in solver.solved_vertical_borders:
            start = (solver.width + 4) * (solver.height + 4) + (solver.width + 4) * (p.y + 1) + p.x + 2
            lineE[f'{start},{start + solver.width + 4}'] = 2
        for p in solver.solved_horizontal_borders:
            start = (solver.width + 4) * (solver.height + 4) + (solver.width + 4) * (p.y + 2) + p.x + 1
            lineE[f'{start},{start + 1}'] = 2
        a = {
            'line': line,
            'lineE': lineE,
            'number': dict([(str((p.y + 2) * (solver.width + 4) + p.x + 2), [solved_text, 2, '1'])
                            for p, solved_text in solver.solved_texts.items()]),
            'squareframe': {},
            'surface': {},
            'symbol': {},
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
