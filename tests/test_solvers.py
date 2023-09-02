import pytest

from solvers import puzzle_list, solve


@pytest.mark.parametrize(
    "puzzle_type,sample,parameters,answer",
    [(p["type"], p["sample"], p.get("parameters"), p.get("answer")) for p in puzzle_list()],
)
def test_solve(puzzle_type, sample, parameters, answer):
    url, grid = solve(puzzle_type, sample, parameters)
    assert url == answer

    # verify uniqueness
    url, _ = solve(puzzle_type, sample, parameters, grid)
    assert url is None
