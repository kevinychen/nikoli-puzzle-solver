import pytest

from solvers import solve, supported_puzzles


@pytest.mark.parametrize('puzzle_type,sample,answer', [(p['type'], p['sample'], p['answer']) for p in supported_puzzles])
def test_solve(puzzle_type, sample, answer):
    assert solve(puzzle_type, sample) == answer
    assert solve(puzzle_type, sample, answer) is None  # verify uniqueness
