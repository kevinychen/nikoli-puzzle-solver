import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place tents into some of the empty cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Every tent must be paired up with an orthogonally adjacent tree
    const paired = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));
    for (const [p, arith] of paired) {
        cs.add(arith.neq(-1).eq(Or(puzzle.symbols.has(p), grid.get(p).eq(1))));
        cs.add(
            Or(
                arith.eq(-1),
                ...puzzle.points.edgeSharingPoints(p).map(q => And(paired.get(p).is(q), paired.get(q).is(p)))
            )
        );
    }

    // Tents cannot be horizontally, vertically or diagonally adjacent
    for (const [p] of grid) {
        for (const q of puzzle.points.vertexSharingPoints(p)) {
            cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
        }
    }

    // The numbers around the grid indicate the number of tents in that row/column
    for (const [line, p] of puzzle.points.lines()) {
        if (puzzle.texts.has(p)) {
            cs.add(Sum(...line.map(p => grid.get(p))).eq(parseInt(puzzle.texts.get(p))));
        }
    }

    const model = await cs.solve(paired);

    // Fill in solved mines
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.symbols.set(p, Symbol.TENT);
        }
    }
};

solverRegistry.push({
    name: "Tents",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv+Ssqn33gV0jLreuaXbJsbTJVEUKRk7gNKsSZgXUiyv/e9x5MYGDSdqjWw2T56fGxzfva+Ev2vRBach+ae8ktbkNzfJ+67XnUrbot4zyRwQW/LvK90pBw/mU65Y8iyeQotGm1FY1O5VVQ3vHyUxAym3HmQLdZxMu74FR+DsoVLxcwxLgNbFZNciC9bdIHGsfspoK2Bfm8ziFdQZrLQ55Vj1+DsFxyhkU+0FJMWap+SFaLwOetSjcxgo3IYSfZPj7WI1mxU89FPdeOzry8rrQuBrS6jVZMK62YDWjFLaDWbay3iVzP3kDuVXQ+w5nfg+B1EKL2b0162aSL4ARxHpyY4/3aafVhmOt0wJgAfLgKwDqbVq9gtTeGMeDN8TNv0kNjt4d8v4cmqKSNoMaUKjkUlyCdly7FjxQtimOKM5pzS/GB4g1Fj6JPcya4+b86nvZm30hO6LpkNGxgsz/JolHI5kW6kfpirnQqErgKi704SgaGY5lK1lmhH8UWbhD5ES4JsAOtMFCi1DGJD+a8+OmgtBwcQih3T0PzN0rvOm9/EUligOr/YqDKCwbKNVz01rPQWr0YJBX53gAtUxhvgptkCsiFKVE8i061tNnzecR+MuqhC/8z9//f7F/8zfD8rfdm2vcmh66u0oO+BzxgfaCDFq95z+XAe37Ggn1LAx1wNdCusQH1vQ2wZ29gv3E4vrVrclTV9TmW6lkdS7XdHkajVw==",
            answer: "m=edit&p=7ZTPb5swFMfv/BWVzz4AJqTl1nXNLlm2LpmqCKHISWiDCnFmYJ2I+N/3/CAhxkzaDtV2mJCfHh//+j7D1/m3ksuY+vCwa2pTBx7X97E5nofNbp9FUqRxcEVvy2InJCSUfppM6BNP89gKHZxtR9axugmqB1p9CELiEEpcaA6JaPUQHKuPQbWk1Ry6CHWATZtBLqT3XfqI/Sq7a6BjQz5rc0iXkBbxvsib189BWC0oUZu8w6kqJZn4HpNWhHrfiGydKLDmBVSS75JD25OXW/FSktP6Na1uG63zAa2s08rOWtmwVrfVuknkJo1X0zeQexPVNZz5FxC8CkKl/WuXXnfpPDjWSteRuN6p0ubDEOb2wAiBewIwz8HZS5jtjaAPeHf8xBsbaMQM5PsGGns9BHtMcCcX4wKk04phfI/RxjjCOMUx9xgfMd5h9DD6OGasiofjuVzDN2bPMDY1NjvMz/UyVa+rF+eZaGygMTOR30PnGpX+2goZQweqx/+9LLJCMiuzdSyvZkJmPIV/ZL7jh5iAE0ku0lVeyie+gV8LjUqR7XGGhlIhDmmy18clz3sh48EuBePt89D4tZDb3uqvPE01kOPFo6HGJBoqZKK9cynFq0YyXuw0cOEWbSU4cl1AwXWJ/IX3dsu6mmuL/CDYQgYXHft/zf2Na06dv/1Hl93l1fVml8u/JQd/XSEHfQ94wPpABy3ecsPlwA0/qw1NSwMdcDXQvrEBmd4GaNgb2C8crlbtm1yp6vtcbWVYXW116fYwsn4C",
        },
    ],
});
