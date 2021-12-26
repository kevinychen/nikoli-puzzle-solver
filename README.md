# Nikoli Puzzle Solver

Solver for several different Nikoli puzzles.

This repository uses the brilliant constraint solver library [Grilops](https://github.com/obijywk/grilops) (based on the Z3 Theorem Prover). It hooks up to the [pzprjs UI](https://github.com/robx/pzprjs) to easily input puzzles.

## One-time setup

Install [Poetry](https://python-poetry.org/docs/), Python's dependency manager.

In the root directory, run:

    poetry install  # note: building the z3 library may take a long time, up to 20 min, on some machines
    git submodule update --init

In the `pzprjs` directory, run:

    npm install
    make

## Running the server

In the root directory, run:

    poetry shell
    flask run

Then go to http://localhost:5000.

## Adding a solver

- Implement a new subclass of `AbstractSolver` in a file named "[puzzle type].py" in the `solvers` directory.
- Update `init.py` with the new solver and puzzle metadata.
- Update [test\_solvers.py](test/test_solvers.py) with a test puzzle.
- Test the puzzle in the UI to verify the serialization to and from pzprjs files is correct.

