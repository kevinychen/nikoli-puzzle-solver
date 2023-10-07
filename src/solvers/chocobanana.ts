import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // A group of shaded cells must form a rectangle or square
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Sum(...vertex.map(p => grid.get(p).eq(0))).neq(1));
    }

    // A group of unshaded cells must not form a rectangle or square
    const isRoot = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    cs.addConnected(
        puzzle.points,
        p => Or(grid.get(p).eq(1), isRoot.get(p).eq(1)),
        (p, q) => And(grid.get(p).eq(0), grid.get(q).eq(0))
    );
    for (const [p] of grid) {
        cs.add(
            Implies(
                isRoot.get(p).eq(1),
                Or(
                    ...puzzle.points
                        .vertices()
                        .filter(vertex => vertex.some(q => q.eq(p)))
                        .map(vertex => Sum(...vertex.map(q => grid.get(q).eq(1))).eq(1))
                )
            )
        );
    }

    // A number indicates the size of the (shaded or unshaded) group that overlaps it
    // A group can contain one or more numbers, or none at all
    for (const [p, text] of puzzle.texts) {
        cs.addContiguousArea(puzzle.lattice, puzzle.points, p, q => grid.get(q).eq(grid.get(p)), parseInt(text));
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Choco Banana",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTfb9owEMff81dUfvZDfgCjeeu6sheWrStTVUURMpCWqAnunGSdjPjfe3cOC04yaXvY1ofJ5HR8fOS+xv66/FoLlfIxjGDKXe7B8P0pPSMXP8exyKo8Dc/4RV1tpYKE84+zGb8XeZk6cVOVOHt9Huprrt+HMfMYZz48Hku4vg73+kOoI65vYIpxD9jcFPmQXrXpLc1jdmmg50IeNTmkd5CuM7XO0+XckE9hrBecYZ+39GtMWSG/pazRgd/XslhlCFaigsWU2+ypmSnrjXysm1ovOXB9YeTeDMgNWrmYGrmYDcjFVfxhuefJ4QB/+2cQvAxj1P6lTadtehPuIUbhngUB/hR2xjN7w0YugskJ8LsVUwSjFownx3/rCKjiB4BWHjW8ozij6FNcgB6uA4rvKLoUxxTnVHNF8ZbiJcURxQnVvMEV/daa/4Kc2Df2wTH+tSxxYhbVxSpVZ5FUhcgZGIiVMl+WtboXazgO5C/YcWA7qrRQLuVTnu3suuxhJ1U6OIUw3TwM1a+k2nTe/izy3ALmtrCQOdgWqhSc2pPvQin5bJFCVFsLnJxw603prrIFVMKWKB5Fp1vRrvngsO+MnjiA2yn4fzv9o9sJt8B9bX59bXLo9Eo1aH3AA+4HOujyhveMDrxnaWzYdzXQAWMD7XobUN/eAHsOB/YTk+Nbuz5HVV2rY6ue27HVqeHjxHkB",
            answer: "m=edit&p=7VRNc5swEL3zKzI66wDIdjG3NI17cd2mdieTYTwe2SYxE7BSAU0HD/89uys7WEBn2kM/Dh3BanlatG8lPeVfS6ljPoQmAu5yD5rvB/QOXHxObZEUaRxe8Muy2CkNDucfJxN+L9M8dqJj1NI5VOOwuuHV+zBiHuPMh9djS17dhIfqQ1jNeDWHIcY9wKYmyAf3unFvaRy9KwN6Lvizow/uHbibRG/SeDU1yKcwqhacYZ639De6LFPfYnbkgd8bla0TBNaygGLyXfJ0HMnLrXos2SlFzatLQ3feQ1c0dMUrXdFP1//9dMfLuoZl/wyEV2GE3L80btC48/BQI68DEwJ/hZ3xzN6wgYvA6Azw2xEBAoMGGI5Oq3UCAguAVB4lvCM7IeuTXQAfXgmy78i6ZIdkpxRzTfaW7BXZAdkRxbzBiqDm8zlGnb9nZA0LkwGWgPljFgJF4ZrOM50wXWA6EzIwIbgW0A3NF9btmWq91+pMRci2diLfqAjb8Oe8pROxWZmtY30xUzqTKQMdsVylq7zU93IDp4JkxgnbU6QFpUo9pcnejkse9krHvUMIxtuHvvi10tvW7M8yTS0gp0vDgsz5tqBCJ9a31Fo9W0gmi50FnB10a6Z4X9gECmlTlI+ylS1raq4d9p3RGwm4pMT/S+ovXVK4Be4vXVV/5Bb5t+jQ6VW6V/oA96gf0F6VH/GO0AHvSBoTdlUNaI+wAW1rG6CuvAHsKBywH4gcZ23rHFm1pY6pOmrHVOeCj5bOCw==",
        },
    ],
});
