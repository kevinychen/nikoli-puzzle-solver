from os import listdir, path
from typing import Optional

from grilops import SymbolGrid

from lib import GlobalTimeoutLock, Penpa, Puzzle
from solvers.abstract_solver import AbstractSolver

# 1st value is the user-facing puzzle type
# 2nd value is a sample puzzle without the solution
# 3rd value is the sample puzzle with the solution filled in (for testing)
PUZZLES = [
    (
        'Fillomino',
        'm=edit&p=7ZTPb9owFMfv/BWVzz7kB6GQW9eVXRhbB1NVRREykJaoCe6cZJ2M+N/73nNQcJJJ22FbD5PJ0+PjF/vr2F8X3yqhEh5A88fc4S40zxvTM3Twd2rLtMyS8IJfVeVOKkg4/zSd8geRFckgqqviwUFPQn3L9YcwYi7jzIPHZTHXt+FBfwz1nOsFdDHuApuZIg/Smya9o37Mrg10HcjndQ7pPaSbVG2yZDUz5HMY6SVnOM87ehtTlsvvCat14P+NzNcpgrUoYTHFLn2ue4pqK5+qutaNj1xfGbmLHrl+IxdTIxezHrm4ij8sdxIfj/DZv4DgVRih9q9NOm7SRXiAOA8PzBviq7Azrtkb5junpZ+A26oYTlogGCEIzsAlglEDRjSofwIwt0sK7ilOKXoUlyCQa5/ie4oOxYDijGpuKN5RvKY4pDiimktc4m99hL8gJ/KMn7AFv5bFgwgsxAqZrYpKPYgNHAhyGOw5sH2VrxNloUzK5yzd23Xp416qpLcLYbJ97KtfS7Vtjf4isswC5r6wkDnaFioVnNuz/0Ip+WKRXJQ7C5ydcWukZF/aAkphSxRPojVb3qz5OGA/GD2RD/eT//9++kf3E26B89YM+tbk0OmVqtf6gHvcD7TX5TXvGB14x9I4YdfVQHuMDbTtbUBdewPsOBzYT0yOo7Z9jqraVsepOm7Hqc4NH8WDVw==',
        'm=edit&p=7VRLj5tADL7nV6A5z2EekARu2+2mlzTtNqlWEYoikrAbtCRseXQrovz3esxzgErtoY9DBRj7G2N/nsFOvmRe7FMLLjmljHK4hJjiYzJ1V9cqSEPfMehNlh6jGBRKP8xm9NELE3/kll6b0SW3nfye5u8cl3BCiYCHkw3N751L/t7JFzRfwhKhHLB54SRAvWvUB1xX2m0Bcgb6otRBXYO6D+J96G/nBfLRcfMVJSrPG/xaqeQUffVJyUPZ++i0CxSw81IoJjkGL+VKkh2i54xUKa40vynoLgfoyoaurOnKYbri99O1N9crbPsnILx1XMX9c6NOG3XpXK6K14UIU30KJ8OLsyGSVaVXAO94mHYHsMYKsFrARAHjBhhjUFkBkJsjgzXKGUqBcgUEaS5RvkXJUFoo5+hzh/IB5S1KE+UYfSaqRNiEuWMAaIC3cSG2hKMQxDEENQhnYPHagt+by0llSfjtTVZ7CvDkpWVbEMSslrhN4dPagpCiCmmb4Cjr+BBD8toRLFFbDLLxOpsASza5IQqXbc+mAs7bFSAV1q5H2PUaa1WAlbdKUPtQW4JpzGyNmV0xU1u6KLeWle9l+V6r93XkimJ4qMv6OW0zcmFekCQKt0kWP3p7+PtxnFDEztlp58caFEbRSxicdb/g6RzF/uCSAv3D05D/LooPneivXhhqQILDUYOKPtagNA4024vj6FVDTl561IBWQ2uR/HOqE0g9naL37HWynZqaryPyjeDjShjG8v8w/kvDWB0B+6WR/EeG479FB//eKB5sfYAHuh/QwS4v8V6jA95raZWw39WADjQ2oN3eBqjf3gD2OhywHzS5itrtc8Wq2+oqVa/bVap2w8MA/Q4=',
    ),
    (
        'Masyu',
        'm=edit&p=7VRdb9owFH3Pr5j87Id8wErz1nWlL6xbB1OFoggZcEvUBHdOsk5G/Pfee5MpOPGkaVK1PkwmR4fji+8xznH5vRZa8jGMaMJ9HsAIwwk9Ix8/v8Yiq3IZv+MXdbVTGgjnn6dTfi/yUnpJW5V6B3Mem1turuOEBYyzEJ6ApdzcxgfzKTZLbuYwxXgA2qwpCoFedfSO5pFdNmLgA79pOdAl0E2mN7lczRrlS5yYBWfY5wP9Gikr1A/JWh/4faOKdYbCWlSwmXKXPbUzZb1Vj3VbG6RHbi4au3OH3aizi7Sxi8xhF3fxynbP0+MR/vavYHgVJ+j9W0cnHZ3HB8AbwoBwGR9YGMAyITQ7NchGoVM9A3XSV8eToQqLT6lFSLgAB9xEhB8JfcIx4YxqrgjvCC8JR4TvqeYM9/DXu3wlO0nYBAbH+M9Y6iWQEVaqfFXW+l5s4MQpQnCooO3rYi21JeVKPeXZ3q7LHvZKS+cUinL74KpfK73trf4s8twSmgvBkpqDtaRKw4t58l1orZ4tpRDVzhJOXmJrJbmvbAOVsC2KR9HrVnR7PnrsJ6MnieACiv5fQP/oAsIj8N9aQN+aHXp7lXZGH2RH+kF1przVB0EHfRBpbDhMNaiOYIPazzZIw3iDOEg4aL8JOa7azzm66kcdWw3Sjq1OA5+k3gs=',
        'm=edit&p=7VTBbptAEL37K9Ce5wC7YGNuaRr34qZN7SqykGVhm8Qo2KQLNBUW/96ZBYIXqFRVitpDtWb2+e145i3et+m3PJAhODiECyZYODh31WOb9GnGMsri0DPgKs8OiUQA8Gk2g4cgTsORX2etR+di6hV3UHzwfGYxYBwfi62huPPOxUevWEGxwCUGFnLzKokjvGnhvVondF2Rlon4tsYIVwh3kdzF4WZeMZ89v1gCoz7v1K8JsmPyPWS1Dvq+S47biIhtkOFm0kP0XK+k+T55ylnTooTiqpK7GJArWrniVa4YlsvfXu50XZb42r+g4I3nk/avLXRbuPDOJemiaKm48s6MW1iGgy6Q2XyQnSDrdlnH7bNYfKZacBWXqAAKoeJ7FU0VHRXnKudGxXsVr1W0VRyrnAntAXc59wzSDMJknsHBYNwGIWosTBDTBuP5nTRYAG1IYXsCzrjGjglOk0+HvcGcPNDkjMFp6nAB3G7rv/Zy3Is6VtuLc+Dior7V4Ck4jX4H9biESzDwHRhnmm/r2aznRT2vaC5HPq+MSsP5PbQe+ehNlibxJs3lQ7DDk6asC4o75cdtKDUqTpLnODrpedHjKZHh4BKR4f5xKH+byH2n+ksQxxqRqotIo6oDpVGZjLTvgZTJi8Ycg+ygERfm0SqFp0wXkAW6xOAp6HQ7tnsuR+wHU48v8OIT/y++v3Tx0V9g/vH192b31L8lR53eRA5aH+kB9yM76PKa7xkd+Z6lqWHf1cgOGBvZrreR6tsbyZ7DkfuFyalq1+ekqmt1atVzO7W6NDxeoD8B',
    ),
    (
        'Minesweeper',
        'm=edit&p=7ZTPb5swFMfv/BWTzz7wI7Qpt65rdsmydclUVQhFTkIbVIg7A+vkKP9733smIwYmbYdtPUwOTy8fP+yvsb8uv9ZCpTyEFoy5yz1ovj+mZ+Ti79gWWZWn0Rt+WVdbqSDh/ONkwu9FXqZO3FQlzl5fRPqG6/dRzDzGmQ+PxxKub6K9/hDpGddz6GLcAzY1RT6k1216S/2YXRnouZDPmhzSO0jXmVrn6XJqyKco1gvOcJ639DamrJDfUtbowP9rWawyBCtRwWLKbfbU9JT1Rj7WTa2XHLi+NHLnA3KDVi6mRi5mA3JxFX9Y7kVyOMBn/wyCl1GM2r+06bhN59Ee4izaM987rtTsDQt8BOEJGCOAvTuCkdsBYXeM8KwLzruv0KA/KkCMR5LuKE4o+hQXoJjrgOI7ii7FkOKUaq4p3lK8ojiieEY157jm3/oqf0FO7BuDYQt/LUucGDzFSpkvy1rdizWcELIcHAJgu7pYpcpCuZRPebaz67KHnVTpYBfCdPMwVL+SatMZ/VnkuQXMBWIhc9YtVCk4yCf/hVLy2SKFqLYWODn01kjprrIFVMKWKB5FZ7aiXfPBYd8ZPXEAF1bw/8L6RxcWboH72gz62uTQ6ZVq0PqAB9wPdNDlDe8ZHXjP0jhh39VAB4wNtOttQH17A+w5HNhPTI6jdn2OqrpWx6l6bsepTg0fJ84L',
        'm=edit&p=7VRBb5swFL7nVyCffQAbEsKt65pdsmxdMlURiiKS0AYVcGdgnYj47302pMRgpPXQbYfJ8Pz43sPvs+F72Y8i4CF2YFAXm9iCQYgrb9sU13msojwOPQNfFfmRcXAw/jKb4fsgzsKR32RtRqdy6pW3uPzk+chCGBG4LbTB5a13Kj975QKXSwghbAE2r5MIuDeteyfjwruuQcsEf9H44K7B3Ud8H4fbeY189fxyhZGo80G+LVyUsJ8haniI5z1LdpEAdkEOm8mO0VMTyYoDeyzQuUSFy6ua7lJDl7Z06StdqqdL3p/udFNVcOzfgPDW8wX3763rtu7SO1WC1wkR67zT+tsgSgTgXACuAEgL2GYHcLprOOMuMOm+4ioZQMaSlNbSzqQl0q6AMS6ptB+lNaV1pJ3LnBtp76S9ltaWdixzJmLPcCpzzwDQgOx6XjSz2czLZl7DjAhs0oBf2UBZHnCEDfh6BiJEoLZAi3SbMJa+RuhgxB6MTHU1qLYytbToYFU6HYrY2pXswZ3Zk8GIq11psLKj3ZmjPYVxPxd+bZ/UbUkM5/e8zciHToQyFm+zgt8He9CVbFRYYmmR7EKuQDFjT3GUqnnRQ8p4qA0JMDw86PJ3jB86qz8HcawAmWy7ClR3CAXKeaQ8B5yzZwVJgvyoABetQlkpTHOVgDhgZe3HoFMtafdcjdAvJG+fQpun/9v8X2rz4hOYb2r2f6TL/lt05N/LuFb6AGvUD6hW5Q3eEzrgPUmLgn1VA6oRNqBdbQPUlzeAPYUDNiBysWpX54JVV+qiVE/totSl4KGBvgA=',
    ),
    (
        'Sudoku',
        'm=edit&p=7VZfT/s2FH3vp5jy7IfYSdwkb4wf7IWxMZgQiiqUlgAVacPSdkyp+t0598bQmz/TNE3TeJjaurcn9jnn2r52N7uH6mWnEryCWPlK4xXEPn/ikN6+e90st2WRfqdOdtvnqkag1E/n5+oxLzfFJHO9ZpN9k6TNlWp+SDNPe8oz+GhvppqrdN/8mDaXqrnGI09pYBdtJ4Pw7Bje8nOKTltQ+4gvXYzwDuFiWS/K4v6iRX5Os+ZGeaTzPY+m0FtVvxee80G/F9VqviRgnm+RzOZ5+eqetNPg+urZQTUnrd3rEbvB0S6FrV2KRuxSFv+y3WR2OGDaf4Hh+zQj778ew/gYXqd7tJfp3jMxDQ3hpV0bzyQEREcg8AmYCkATgMX8BIKP2foAQgJiAUQEWAFYApIjEBoCAgHwEOEj5CHCacQqQjbiIcJY1FexbF2Q2r6snfacxpy+GBIzhyCNmUPIxjwfwmnMPoRKwk4lwD2ESsLLIHxon7sIGe2zV6GjfV5NMSXaZx6hpHV/PbXuZ6Q1pyTsaD3gMdxHLLI2vCDSs+E8JbMZZGE4C+k5YGY5arChdDDwE3Jen7OB/a15l99xe86t4fYGRaCagNtv3PrcRtxecJ8z1IaOrdK0EAaMSaIMTQtifCtDqVFsImUCTDvFODZNhMmkONLKWNim2IbKTJEmxdOpMgmsUpzgcPWxWYg/Br/v+H3wa8evwU9FylrgDx1/CH6qANYCP21c1gI/7VmKcXCbpOXHN7Qw+cxD/h1uAsSOx4BH5kWLxbFF7PgN+KUfOi84hn86KngeoEunBPuheXB5Wehap2uhK+fHOl0LXet0LXRlXtbpWuhap2uhOyVdLNotL90ptyG3lpd0Sqfe3zoX//nu+Us7GWaPrlj5ir4WMptkuMW9TVXeb3b1Y77AncSXPK4dYOvdal7UHaisqtdyue72Wz6tq7oYfURg8fA01n9e1Q899re8LDvA5rddXncHt7drB9rWuDrF77yuq7cOssq3zx1AXLMdpmK97RrY5l2L+UveU1sdcz5MvD88/mQB/iIF//9F+o/+ItES+F/tQPhqdnj3VvVo6QMeqX6go1Xu8EGhAx+UNAkOqxroSGED7dc2oGF5AxxUOLA/KXJi7dc5ueqXOkkNqp2kZMFns8k7',
        'm=edit&p=7VdNb9tGEL3rVwg872FnlvvFW5rGvbhuU7soDMEwaFuJhUhmSklNQUP/PTPLdaVdboAURdEcClnL8SP53pvZnRW53T90H/bC00c5IQXQRzkZvq7mPxk/V6vdetnMxav97rHrKRDip7Mz8a5db5ezRbzqZvY8+GZ4K4YfmkUFlaiQvlDdiOFt8zz82AwXYrikU5UAws7Hi5DCN8fwt3Ceo9cjCJLiixhTeE3h/aq/Xy9vz0fk52YxXImKdb4Ld3NYbbo/llX0wf/fd5u7FQN37Y6S2T6uPsYz21CG6kXiIIZXo93Lgl11tKv+sqvKdvHft+tvDgcq+y9k+LZZsPdfj6E7hpfN84F9PVfo+NaavIxzU6FnQB8BJRmwJwAwgCeAeqnWC1Az4E4AzYA5AQwD/gjUyIA6AXTmozaZU11nslpnxnSuYiAjNbmssZlTJ7NbHGSkDjNZpzKnzmQqXueAyVS8z3yANJkMSJvpgHRZSUD6TAkgn0+APCMAzOwATHgQs0kGrHPPqHNmnGSBNvesML9rsqBATfzUMqkGrW8Iq/w6jGdhxDBeUROIQYXx+zDKMOownodr3lBvgDMCeCKQGL0XyGWhmI4COTWOUQtUboxp20QNY6xBoKnH2NQCrR1jawV6OcaeNlepRn5H/DLyS+KHyA/Ej5Efib+O/DXx68ivid9EfkP8LvLTxo1eRS1FWibysP+Io6I48mCd5oUv1xuKIz/a1A/6GJN/FXUV6aro03AdYl6GdE3UNSqtj4m6hnRN1DUmzctEXUO6Juoa0rWse+Dtl6fudRjrMJowpZZ3PdoXz5s5gXOa3PF4QceKV9s8LKU5inlYTPOKqzwPK+4UVAE0KVgH0KegDSCkoAugTUEfQExAbQtC2hUsaV/gNDKAdQqWbje+cKWVBU4LhYxsqXRWFTKypSpZHUCdgK4u5O50wbwrFdmViuxVCawLt3tb8OldISOQpSqDLC0cAFVES6kClsoPCIVaAaqSB1Vap6B0IV/gH+JpbsqW1NSkttxEMjbTZTxe8/EwW9DmANlHf1vIzWxBD6nVtlvfbvf9u/aeHrnCM6wI2NN+c7fsE2jddR/Xq6f0utX7p65fFk8xuHx4X7r+rusfMvZP7XqdANvf922f3jw+PCbQrl8l/7d9331KkE27e0yAk6fIhGn5tEsN7NrUYvuhzdQ2x5wPs+rPKnwXit4A1P9vAP/RGwBPgfxb7wH//GnpK35+vy07YfV2fbH1CS50P6HFLo/4pNEJn7Q0C067mtBCYxOa9zZB0/YmcNLhhH2hyZk173N2lbc6S026naVOG5420M8=',
    ),
]

# Dynamically import all py files in this directory
# https://stackoverflow.com/a/6246478
for py in [f[:-3] for f in listdir(path.dirname(__file__)) if f.endswith('.py') and f != '__init__.py']:
    __import__('.'.join([__name__, py]), fromlist=[py])


def puzzle_list():
    return [{'type': puzzle[0], 'demo': puzzle[1]} for puzzle in PUZZLES]


def solve(puzzle_type: str, url: str, different_from: Optional[str] = None):
    solver = next(subclass for subclass in AbstractSolver.__subclasses__()
                  if subclass.__name__ == ''.join(c for c in puzzle_type if c.isalpha()))()
    penpa = Penpa.from_url(url)
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
        solved = Puzzle()
        solver.set_solved(original, sg, sg.solved_grid(), solved)
        solution = penpa.to_url(solved)
        if solution != different_from:
            return solution
        if sg.is_unique():
            return None
        solved = Puzzle()
        solver.set_solved(original, sg, sg.solved_grid(), solved)
        return penpa.to_url(solved)
