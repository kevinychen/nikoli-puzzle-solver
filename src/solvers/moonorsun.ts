import { Constraints, Context, Puzzle, Solution, ValueSet } from "../lib";

const solve = async ({ Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // Every region must be visited exactly once
    const regions = puzzle.regions();
    for (const region of regions) {
        cs.add(
            Sum(
                ...region.flatMap(p =>
                    puzzle.points
                        .edgeSharingNeighbors(p)
                        .filter(([q]) => puzzle.borders.has([p, q]))
                        .map(([_, v]) => grid.get(p).hasDirection(v))
                )
            ).eq(2)
        );
    }

    // Within a region, the loop must pass through all moons and no suns, or all suns and no moons
    const symbols = [...new ValueSet([...puzzle.symbols.values()])];
    const whichSymbol = new Map(regions.map(region => [region, cs.int(0, 1)]));
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(
            grid
                .get(p)
                .neq(0)
                .eq(whichSymbol.get(regions.get(p)).eq(symbols.findIndex(s => s.eq(symbol))))
        );
    }

    // All regions must have at least one moon or sun that is used by the loop
    for (const region of regions) {
        cs.add(Or(...region.filter(p => puzzle.symbols.has(p)).map(p => grid.get(p).neq(0))));
    }

    // The loop may not pass through the same type of clue in two consecutively used regions
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(
                Implies(
                    grid.get(p).hasDirection(p.directionTo(q)),
                    whichSymbol.get(regions.get(p)).neq(whichSymbol.get(regions.get(q)))
                )
            );
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Moon or Sun",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VXPb9pMEL3zV0R73oN3DfnAN5omvaTpD/IpiiyEFuIEFJtN13ZTGfG/583YCIy3ahWpag6V8fB4Hr+ZHfst+bfSuEQOcIRDGUiFQ+shn/2APrvjelWkSXQix2WxtA5Ayk8XF/LepHnSi5usaW9TjaJqLKsPUSyUkELjVGIqqy/RpvoYVbeymuCSkArcZZ2kAc/38IavEzqrSRUAXzUY8BYwL9ezzNp1zXyO4upaCqrzju8mKDL7PRFNH/R7YbP5ioi5KbCYfLl6aq7k5Z19LJtcNd3Kaly3O/G0G+7bJVi3S8jTLq2C2l2s3CJNZpd/oN3RdLvF2L+i4VkUU+//7+FwDyfRBvGKo+J4G22EVpDRJHkwT6FDsKrD9r3syKcQBl6WqnUUQq9C36vQH/oUBpTbZb1rG5x2WQzjgkeiOV5jYrIKOb7nGHAccLzknHMMbxTiYWsRQU0FsM4hVmiJ8WiPFQym0BRjyqnzR33ciolzOiQbGt/ADa+Ix/x3t+pGUkOSngBjlKK5Ew7B07QZIz9sNDXh3b2ks6sFfcZY2g0v8Ixjn+MpL/w/epFe/aq9bsa/bCemCTTH4PfQtBeL87uH5OTKusykMNVkaZ4Sgd1L5Dad5aW7Nwt4kTc3vCng1mU2T1yLSq19Slfrdt7qYW1d4r1EZIKynvy5dXdH6s8mTVtEvVW3qHpXaVGFw5Zx8Ns4Z59bTGaKZYs42F5aSsm6aDdQmHaL5tEcVcv2a972xA/BZxziryH899fwl/4a6BEEb821b60dfnut81oftMf9YL0ub/iO0cF3LE0Fu64G6zE22GNvg+raG2TH4eB+YnJSPfY5dXVsdSrVcTuVOjR8PO29AA==",
            answer: "m=edit&p=7VXfb9o8FH3nr6j87IfYTgrJG+vavXTdvtGpqiKEAk0LaoK7/Pg6BfG/91w7DEI8rao0bQ9TwByOr6+vr++5Kb/VSZHyAI8acY8LPFKOzNf36LN7rldVlkYnfFxXS10AcP7p4oLfJ1mZDuLWajrYNGHUjHnzIYqZYJxJfAWb8ua/aNN8jJpb3kwwxbgAd2mNJOD5Ht6YeUJnlhQe8FWLAW8By3o9y7VeW+ZzFDfXnNE+78xqgizX/6esjYP+L3Q+XxExTyocplyuntqZsr7Tj3VrK6Zb3oxtuBNHuGofLkEbLiFHuHQKCnexKhZZOrv8DeGG0+0Waf+CgGdRTLF/3cPRHk6iDcYrMwoz3kYbJgXcSHJ5kE8mFVjRY30nG7o8KM/J0m49D8rpwXd68EcuDwHZ9lnn2YLTPotkXJiUSDNeI2O8UWZ8b0bPjIEZL43NOZIXKly2ZBG8CQ/SOcQCIRkc7rGAwASCMphsrH3oYykybszhsqXxC9zygnjkf7dUti4lXNINGIytKO+EFXjKtsGwV61PSXi3lvzs9oJ/g3G0G3PAMzP6Zjw1Bx9SIaHUDhNjZ5AShkiomBQqAgghEaJuYpHkFA4hxamQLKKwCPlc4aCEQjQigxA1lQAhyX27Vinu2xXoVv7QIGpTdtaXnK6c0JBToRAa8cDaBYKfWn/BkAd2NsCsjTQI7ay92SOh2Nu3AoJoflSITZStil/obzuI6araJ3gdmg5idn73kJ5c6SJPMqh/skyeUoY2y0qdzcq6uE8WaBqmC6Okwa3rfJ4WHSrT+ilbrbt2q4e1LlLnFJEptnXYz3Vxd+T9OcmyDmHfKR3Ktr8OVRXobQf/k6LQzx0mT6plhzjogx1P6brqBlAl3RCTx+Rot3x/5u2AfWfmGyu8w9S/d9gfeofRFXhvfpO9rYW/otv9XeGY6tWFU/qgHeoH61R5y/eEDr4nadqwr2qwDmGDPdY2qL68QfYUDu4nIievxzqnqI6lTlv11E5bHQo+ng5eAA==",
        },
    ],
});
