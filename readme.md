# Nikoli Puzzle Solver

Solver for over 100 types of Nikoli-style logic puzzles, including Sudoku, Slitherlink, Masyu, Nonograms, Skyscrapers, Light Up, Kakuro, and many more, conveniently deployed as a web app for easy use. Try it at https://util.in:8102.

The app hooks up to the [Penpa UI](https://github.com/swaroopg92/penpa-edit) to make it easy to input and view puzzles.

![Solving](solving.gif)

## Features

- Supports [over 100 puzzle types](src/solvers)
- Supports unique solution checking
- Supports irregularly shaped grids and grids with holes (when appropriate for the puzzle type)
- Supports different tilings, such as hexagonal and triangular grids (when appropriate for the puzzle type)
- Easy for someone with programming experience to modify solvers for puzzle variants, or add new solvers

## Instructions

- Go to https://util.in:8102.
- Input a puzzle, or choose a sample puzzle from the list on the bottom left. (You can also click Load to load any Penpa URL from the web.)
- In the dropdown menu on the bottom right, select the desired puzzle type/rules to solve with.
- Click "Solve". The grid will be automatically filled if a solution is found.

## Development

### One-time setup

To host the server yourself, you need Node.js. This was tested with Node.js v20.6.1.

Run the following:

    git clone https://github.com/kevinychen/nikoli-puzzle-solver.git
    cd nikoli-puzzle-solver
    npm install
    git submodule update --init

### Running the server

To generate production assets and start the server, run:

    npx webpack --mode production
    node server.js

Then go to http://localhost:8080.

To run a development server, which will automatically refresh when the source code changes:

    npx webpack serve --mode development

### Running tests

Start the development server with `npx webpack serve --mode development`, then go to http://localhost:8080/test.html.

### Adding a solver

- Create a new file in the [solvers](src/solvers) directory.
- Using the existing solvers as examples, define a solve function that takes a Z3 `Context` (to construct constraints) and a `Puzzle` (that contains the contents from the Penpa UI) as input.
- At the bottom of the file, add it to the solver registry with `solverRegistry.push({...})`.
    - You can construct the sample puzzle in Penpa, and click "Share" -> "Editing URL" to get the encoded puzzle.
- Run the tests to verify the new solver implementation and sample puzzle are correct.

### Credits

This project was based on and inspired by the brilliant puzzle solver library [Grilops](https://github.com/obijywk/grilops).
Thanks to puzz.link and similar sites for puzzle rules and sample puzzles.

