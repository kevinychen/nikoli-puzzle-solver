import { Constraints, Context, Puzzle, Solution, ValueSet } from "../lib";

const solve = async ({ Implies, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
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
    // All regions must have at least one moon or sun that is used by the loop
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
    regions.forEach(region => {
        symbols.forEach((symbol, index) => {
            if (region.filter(p => puzzle.symbols.get(p)?.eq(symbol)).length == 0) {
                cs.add(whichSymbol.get(region).neq(index))
            }
        });
    })

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
            answer: "m=edit&p=7VXfb9owEH7nr6j87IfYTgrJW9e1e+m6dXSqqgihQNOCmuAuP9YpiP+939lhEOJpVaVpe5gC5uPz+Xw+33cpv9VJkfIAjxpxjws8Uo7M1/fos32ul1WWRkf8pK4WugDg/NP5Ob9PsjIdxK3VZLBuwqi54s2HKGaCcSbxFWzCm6to3XyMmlvejDHFuAB3YY0k4NkO3ph5QqeWFB7wZYsBbwHLejXNtV5Z5nMUN9ec0T7vzGqCLNffU9bGQf/nOp8tiZglFQ5TLpZP7UxZ3+nHurUVkw1vTmy4Y0e4ahcuQRsuIUe4dAoKd74s5lk6vfgD4YaTzQZp/4KAp1FMsX/dwdEOjqM1xkszCjPeRmsmBdxIcrmXTyYVWNFjfScbujwoz8nSbj0PyunBd3rwRy4PAdn2WefZguM+i2Scm5RIM14jY7xRZnxvRs+MgRkvjM0ZkhcqXLZkEbwJD9LZxwIhGRzusIDABIIymGysfehjKTJuzOGypfEL3PKCeOR/u1S2LiVc0g0YjK0o74QVeMq2wbBXrU9JeLuW/Gz3gn+DcbQbc8BTM/pmPDYHH1IhodT2E2NnkBKGSKiYFCoCCCERom5ikeQUDiHFqZAsorAI+VzhoIRCNCKDEDWVACHJfbtWKe7bFehW/tAgalN21pecrpzQkFOhEBrxwNoFgh9bf8GQB3Y2wKyNNAjtrL3ZA6HY27cCgmh+VohNlK2K3+hvM4jpqtoneB2aDGJ2dveQHl3qIk8yqH+8SJ5ShjbLSp1Ny7q4T+ZoGqYLo6TBrep8lhYdKtP6KVuuunbLh5UuUucUkSm2ddjPdHF34P05ybIOYd8pHcq2vw5VFehte/+TotDPHSZPqkWH2OuDHU/pquoGUCXdEJPH5GC3fHfmzYD9YOYbK7zD1P932F96h9EVeG9+k72thb+i2/1b4Zjq1YVT+qAd6gfrVHnL94QOvidp2rCvarAOYYM91DaovrxB9hQO7hciJ6+HOqeoDqVOW/XUTlvtCz6eDF4A"
        }
    ],
});
