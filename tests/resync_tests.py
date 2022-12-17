from os import path

from ruamel.yaml import YAML

from solvers import puzzle_list, solve

# Convenience script to update all expected values in the test file. The tests will always pass after this is run, so
# this should be run only if an irrelevant part of the output format is changed.

puzzles = puzzle_list()
for p in puzzles:
    p["answer"] = solve(p["type"], p["sample"], p.get("parameters"))
with open(path.join(path.dirname(__file__), "../supported_puzzles.yml"), "w") as fh:
    YAML().dump(puzzles, fh)
