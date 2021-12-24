# Nikoli Puzzle Solver

Solver for several different Nikoli puzzles.

## One-time setup

In the root directory, run:

    poetry install  # note: building the z3 library takes a long time (~20 min)
    git submodule update --init

In the `pzprjs` directory, run:

    npm install
    make

## Running the server

In the root directory, run:

    flask run

Then go to http://localhost:5000.

