import pytest

from solvers import PUZZLES, solve


@pytest.mark.parametrize('puzzle_type,penpa,expect', PUZZLES)
def test_solve(puzzle_type, penpa, expect):
    assert solve(puzzle_type, penpa) == expect
    assert solve(puzzle_type, penpa, expect) is None  # verify uniqueness
