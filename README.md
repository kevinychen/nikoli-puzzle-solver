# Nikoli Puzzle Solver

Solver for over 30 types of Nikoli-style logic puzzles, including Sudoku, Slitherlink, Masyu, Nonograms, Skyscrapers, Light Up, Kakuro, and many more, conveniently deployed as a web app for easy use. Try it at https://util.in:8102.

This repository builds on top of the brilliant puzzle solver library [Grilops](https://github.com/obijywk/grilops). Some puzzle implementations are taken or inspired/improved from the [Grilops examples](https://github.com/obijywk/grilops/tree/master/examples), and others are new. It hooks up to the [pzprjs UI](https://github.com/robx/pzprjs) (which powers [puzz.link](https://puzz.link)) to make it easy to input and view puzzles.

![Solving](solving.gif)

## Instructions

- Go to https://util.in:8102.
- In the dropdown menu at the top, select the desired puzzle type. (You can also click File -> Load from URL to immediately load any [puzz.link](https://puzz.link) URL.)
- Input a puzzle, or click "Demo" on the bottom left to load a sample puzzle.
- Click "Solve". The grid will be automatically filled if a solution is found. Requests will time out if no solution is found after 30 seconds.

## Development

### One-time setup

Install [Poetry](https://python-poetry.org/docs/), Python's dependency manager.

In the root directory, run:

    poetry install  # note: building the z3 library may take a long time, up to 20 min, on some machines
    git submodule update --init

In the `pzprjs` directory, run:

    npm install
    make

### Running the server

In the root directory, run:

    poetry shell
    flask run

Then go to http://localhost:5000.

### Adding a solver

- Implement a new subclass of `AbstractSolver` in a file named "[puzzle type].py" in the `solvers` directory.
- Update `init.py` with the puzzle type, name, reference to the solver class, and a test puzzle.
- Update [test\_solvers.py](test/test_solvers.py) with the test puzzle.
- Test solving the puzzle in the UI to verify the serialization to and from the pzprjs format is correct.

