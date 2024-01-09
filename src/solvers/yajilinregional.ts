import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board, and draw a single loop that goes through all remaining cells
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);
    const shadedGrid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    for (const [p, arith] of grid) {
        cs.add(shadedGrid.get(p).eq(1).eq(arith.eq(0)));
    }

    // Shaded cells cannot be orthogonally adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(shadedGrid.get(p).eq(0), shadedGrid.get(q).eq(0)));
    }

    // A number indicates the amount of shaded cells in the outlined region
    const regions = puzzle.regions();
    for (const [[p], text] of puzzle.edgeTexts) {
        cs.add(Sum(...regions.get(p).map(q => shadedGrid.get(q))).eq(parseInt(text)));
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        if (model.get(shadedGrid.get(p))) {
            solution.shaded.add(p);
        } else {
            for (const v of network.directionSets(p)[model.get(arith)]) {
                solution.lines.set([p, p.translate(v)], true);
            }
        }
    }
};

solverRegistry.push({
    name: "Yajilin (regional)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb5s8GL3Pr6h87Qtsky7hruuS3WTZumSqKoQiktAGFeLOwDoR5b/32DgjfLzatGl6ezERHh0fH/wcHB+yr0WoIjrEJUbUoQwX5yNzu47+na5lnCeRd0GvinwnFQClH6dTeh8mWTTwrSoYHMqxV97Q8r3nE0Yo4bgZCWh54x3KD145p+UCU4QycLNKxAEnNbw18xpdVyRzgOfAonrsDnATq00SrWYV88nzyyUlus9b87SGJJXfImJ96PFGputYE+swx8tku/jJzmTFVj4WVsuCIy2vKruLHruitqthZVejtl37Pn/Z7jg4HrHtn2F45fna+5cajmq48A6oc1OZdyCu4+oV8AfBEnHZpR45djQyc6fNuDMPTU3lpi6xJi2Fqe9MdUwdmjozmgmajF1shyAexylwBGWMV5jhoP3AOHaMWc0Y2Kk13GIODR9bDI0YWQ0Hb5/l0AurF9CLk16vY3txrdd+4O/WuLw21TX10rh/o/frN3b0Tzbqp3Z8vQP2Gv4aCgY+mWwfoou5VGmY4OzMi3QdqdMYYSWZTFZZoe7DDY6eyTJOF7i9UTaoRMqnJN43dfHDXqqod0qTEdr36NdSbVurP4dJ0iCqL1ODqkLUoHKFhJyNQ6Xkc4NJw3zXIM7S1Fgp2udNA3nYtBg+hq1uaf3OxwH5TsztC3wJxb8v4f/0JdR/gfPa0vva7JjTK1Vv9EH3pB9sb8ot3wk6+E6kdcNuqsH2BBtsO9uguvEG2Uk4uP8IuV61nXPtqh113aqTdt3qPPB+MHgB",
            answer: "m=edit&p=7VRNj9owEL3zK1Y+zyH+CCS5bbfQC6XdslW1ihAKkF2iDWSbhG4VlP/eGdsQAqm0alW1hypkeH4e28+O3xRfd1Eeg4uP9MABjo8Qnn6VQ7/Dc5eUaRxcwfWuXGc5AoAPoxE8RGkR90KbNevtKz+obqF6F4SMM2ACX85mUN0G++p9UE2gmmIXA47c2CQJhMMGftH9hG4MyR3EE8TSDLtHuEzyZRrPx4b5GITVHTBa540eTZBtsm8xszqovcw2i4SIRVTiZop18mx7it0qe9rZXD6robo2cqcdcmUjVx7lyg65dj9/WK4/q2s89k8oeB6EpP1zA70GToN9Tboo8mDPlKNoBqElMcX71HJsy1Onh3GvB410FDre4ZxQSR3f6ujo6Oo41jlDXMRXeBySBQJvgSOBc2Ew5ycYrx3nNsdH7DQ5wmKBOcK3GHOkZ3ME8naswHxp8yXmS7/hhV1LUD7pqenDkcobHZWOfa1+QOeFJ3q6u/5hX0yQQVgggRAtR0gATUpIglAGKZCW8495iDyNpDj0IlLcILTcwCAfnXdEZgS50TeIgzIKlADXjFUDcPsGeeCaWZQPrpnFdcA1Y10Ofcv1D3mubzjzyU7vSH34rFPaOOZwVMT1n4uq+PFqmOtAB1r3QmHKCD3u69CsF7Lh6jG+mmT5Jkrxlk92m0WcH9pYVliRpfNilz9ESzSJrjqgua3ObFFplj2nybadlzxuszzu7CIyxuU78hdZvjqb/SVK0xZR6BraoozdW1SZJ612lOfZS4vZROW6RZz4vjVTvC3bAsqoLTF6is5W2zR7rnvsO9NvKLFmy/81+y/VbPoEzi9U7t8pyK8oe/+WHH17s7zT+kh3uB/ZTpdb/sLoyF9Ymha8dDWyHcZG9tzbSF3aG8kLhyP3E5PTrOc+J1XnVqelLtxOS50aPpz1fgA=",
        },
    ],
});
