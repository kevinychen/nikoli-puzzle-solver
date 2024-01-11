import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Implies, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells to divide the grid into countries
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Some cells have a number
    // The number indicates the amount of shaded cells orthogonally adjacent to this cell
    for (const [p, text] of puzzle.texts) {
        if (text !== "?") {
            cs.add(Sum(...puzzle.points.edgeSharingPoints(p).map(q => grid.get(q))).eq(parseInt(text)));
        }
    }

    // Some cells have a shape
    const allShapes = [...new Set([...puzzle.symbols.values()].map(symbol => symbol.shape))];
    const countryGrid = new ValueMap(puzzle.points, _ => cs.choice(allShapes));
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(countryGrid.get(p).is(symbol.shape));
    }

    // All identical shapes must be in the same country, and different shapes must be in different countries
    // There can be no countries without colors
    for (const [p, arith] of grid) {
        cs.add(arith.eq(1).eq(countryGrid.get(p).eq(-1)));
    }
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(1), grid.get(q).eq(1), countryGrid.get(p).eq(countryGrid.get(q))));
    }
    const countryRoots = new ValueMap(allShapes, _ => cs.choice(puzzle.points));
    for (const [p] of grid) {
        for (const shape of allShapes) {
            cs.add(Implies(countryRoots.get(shape).is(p), countryGrid.get(p).is(shape)));
        }
    }
    cs.addConnected(
        puzzle.points,
        p => Or(grid.get(p).eq(1), ...allShapes.map(shape => countryRoots.get(shape).is(p))),
        (p, q) => And(grid.get(p).eq(0), grid.get(q).eq(0))
    );

    // Cells with numbers cannot be shaded
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // All shaded cells must be used to divide countries, i.e. each shaded cell must be adjacent to
    // 2 or more different countries
    for (const [p, arith] of grid) {
        const neighbors = puzzle.points.edgeSharingPoints(p);
        cs.add(
            Implies(
                arith.eq(1),
                Or(
                    ...neighbors.flatMap(q =>
                        neighbors.map(r =>
                            And(grid.get(q).eq(0), grid.get(r).eq(0), countryGrid.get(q).neq(countryGrid.get(r)))
                        )
                    )
                )
            )
        );
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
    name: "International Borders",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTRb9o+EMff+SsqP/uBJBDavPzUdeX3Qtk6mKoqipABt0RNMHOSdTLif+/dOSs4yR42qVofJsun4+PL3dn46+JbJbTkIYzgnPe5B8MPQ5reYECzX495WmYyOuOXVblRGhzOP43H/EFkhezFdVTS25uLyNxy838UM49x5sP0WMLNbbQ3N5GZcjODJcY9YBMb5IN7fXTvaB29Kwu9PvhT8EP72T24q1SvMrmYWPI5is2cM6zzgb5Gl+Xqu2R1H/h7pfJlimApSthMsUl39UpRrdVTVcd6yYGbS9vurKPd4NguurZd9Jrt1vt543YvksMBjv0LNLyIYuz969E9P7qzaA92Gu1ZMMBP/4NeOBwp5Bv4COCvegVDBMEJGDUiRsHP0yIAmT3Kfw/5KR3wUqfVrt6zTQlwnYpcbdevGBM3Y8PQQufUbMlmBig5psI+2TnslZuA7EeyfbJDshOKuSZ7R/aK7IBsSDEjPK3fOs/Tvb9RO7HvkzjtGP65n/RiNq3ypdRnN3CZZhuxkwxUywqVLYpKP4gV3EESNVwzYFsKdlCm1C5Lt25c+rhVWnYuIZTrx674pdLrRvZnkWUOsI+Ug+y9cBDcH+e30Fo9OyQX5cYBJ7JyMslt6TZQCrdF8SQa1fLjng899oPRjAN4EoN/T+JfehLxL+i/NyG/t3bo9irdKX3AHeoH2qnymreEDrwlaSzYVjXQDmEDbWobUFveAFsKB/YLkWPWps6xq6bUsVRL7VjqVPBx0nsB",
            answer: "m=edit&p=7VRBb5swFL7zKyqffQiYQMtl6rpmlzRbl0xVhVDkJLRBhTgzsE5E/Pc+P7MEAz10UrUdJsvPj8/P7302/pz/KLmMqQeNndMRtaE5nofddl3so6YtkiKNgzN6WRZbIcGh9MtkQh94msdW2ERF1qG6CKpbWn0OQmITShzoNolodRscqpugmtFqDlOE2oBNdZAD7vXJvcN55V1p0B6BPwPf08vuwV0ncp3Gy6lGvgZhtaBE1fmIq5VLMvEzJg0P9b0W2SpRwIoXsJl8m+ybmbzciKeyibWjmlaXmu58gC470WVHumyAbrOfd6Z7EdU1HPs3ILwMQsX9+8k9P7nz4FArXgfCXLX0A3ChcKSQz3UU4LSAsQJYC/A7ET77fVoIQGYb899DfkwHeCGTct/sWacEcJPwTOw2R9gfiPU8DRqnpkt2M0DJCRZ20C5gr7RiaD+hHaEdo51izDXaO7RXaF20Hsb46rTgPNs5vN7qGVq9ZV1hrg4W9ggEXaYHVw8eDmNHD82Xj4OnF/gqUh/ecQ+KX22FjoOq1G38535khWRWZqtYnt3ALZpv+T4mIFeSi3SZl/KBr+HyoZopYjsMNqBUiH2a7My45HEnZDw4pcB48zgUvxJy08n+zNPUAHJ8nQxIXwgDgotjfHMpxbOBZLzYGkBLT0ameFeYBApuUuRPvFMtO+25tsgvgj1k8Bay/2/hX3oL1S8YvelFbL9e7/ag/Ft08PYKOSh9gAfUD+igyhu8J3TAe5JWBfuqBnRA2IB2tQ1QX94A9hQO2CsiV1m7OlesulJXpXpqV6Xagg8j6wU=",
        },
    ],
});
