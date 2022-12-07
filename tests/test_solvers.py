import pytest

from solvers import puzzle_list, solve


@pytest.mark.parametrize('puzzle_type,sample,parameters,answer',
                         [(p['type'], p['sample'], p.get('parameters'), p['answer']) for p in puzzle_list()])
def test_solve(puzzle_type, sample, parameters, answer):
    assert solve(puzzle_type, sample, parameters) == answer
    assert solve(puzzle_type, sample, parameters, answer) is None  # verify uniqueness
