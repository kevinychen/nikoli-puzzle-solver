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
            answer: "m=edit&p=7VXJbtswEL37KwKe5yAusi3d0jTpJU0XpygCwTBkR4mFSFaqpS1k6N87Q9JRZLFAEKBoD4Us+unNcDhc3rD61sRlAj4+cg4ecHyEmOtXefQ7PNdpnSXhCZw29bYoEQB8uLiAuzirkklkvZaTfRuE7Sm078KIcQZM4MvZEtpP4b59H7Y30C7QxIAjd2mcBMLzHn7VdkJnhuQe4iuLEd4grJrdKi+KnWE+hlF7DYzGeaN7E2R58T1hNg/63hT5OiViHdc4mWqbPlpL1dwWDw07DNFBe2rSXTjSlX268ild6U5X2HQ3abnJktXlH0g3WHYdLvtnTHgVRpT7lx7Oe7gI9x3lRS3X7U24Z4JjGAHD9WRCIstHrHKygSuC9Jwsd0WQzgjKGUHNXRF8z8k65+ZPxywuxoVeEqHba1wxaKVu3+rW062v20vtc46LF0jcbMFCjMY9PsTcszjoMUeBcW4x+Rj/QGFXad3lE43/iC3PiVd9V2FDCgxJO6AxDiUtL5GXdiiJ/tLGFLz3ISxEH1/jjk40TfBMt0q3Uz3xGR0kPGrPF2Z6WBKGmdBhkqBRYBBVE4MESGuVQAfJIGmtCqQ0KMBCpBFmTUeAkABl+koJyvTAaqVmGlGZMlYlwLdoBspEUXPwjZ/PYWri+TPwjdVHq8nUD4zV7OyRUMzuLw6ieTohtFDdJBKmbtLjvwwtJxE7v71PTq6KMo8zlPViGz8mDOsnq4psVTXlXbzBaqDLK2hu1+TrpBxQWVE8Zulu6Jfe74oycZqITHBYh/+6KG+Pov+Is2xAVPqyGFCmrg2oukwH33FZFj8GTB7X2wHxrMANIiW7ephAHQ9TjB/io9Hyfs7dhP1k+o0kXk7y/+X0ly4n2gLv1VfU62rzC8rYv5WOPr1F6ZQ+0g71I+tUueVHQkd+JGkacKxqZB3CRvZY20iN5Y3kSOHI/UbkFPVY55TVsdRpqJHaaajngo+Wk18=",
        },
    ],
});
