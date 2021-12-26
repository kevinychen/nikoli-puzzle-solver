# Nikoli Puzzle Solver

Solver for several different Nikoli puzzles.

This repository uses the brilliant constraint solver library [Grilops](https://github.com/obijywk/grilops) (based on the Z3 Theorem Prover). It hooks up to the [pzprjs UI](https://github.com/robx/pzprjs) to easily input puzzles.

## One-time setup

In the root directory, run:

    poetry install  # note: building the z3 library may take a long time (up to 20 min)
    git submodule update --init

In the `pzprjs` directory, run:

    npm install
    make

## Running the server

In the root directory, run:

    flask run

Then go to http://localhost:5000.

