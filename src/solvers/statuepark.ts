import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place every shape from the bank into the grid
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Shapes can be rotated or mirrored
    // There cannot be shapes in the grid that aren't present in the bank
    const size = parseInt(puzzle.parameters["size"]);
    const polyominoes = puzzle.lattice.polyominoes(size);
    const placements = puzzle.points.placements(polyominoes);
    const shapeLocation = new Map(polyominoes.map(polyomino => [polyomino, cs.int()]));
    for (const [p] of grid) {
        cs.add(
            Or(
                grid.get(p).eq(-1),
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(
                            ...placement.map(p => grid.get(p).eq(instance)),
                            shapeLocation.get(polyominoes[instance]).eq(type)
                        )
                    )
            )
        );
    }

    // All shapes must be used exactly once
    for (let i = 0; i < polyominoes.length; i++) {
        cs.add(
            Or(
                ...[...puzzle.points]
                    .flatMap(p => placements.get(p))
                    .filter(([_, instance]) => instance === i)
                    .map(([placement, instance]) => And(...placement.map(p => grid.get(p).eq(instance))))
            )
        );
    }

    // Two shapes cannot be orthogonally adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(-1), grid.get(q).eq(-1), grid.get(p).eq(grid.get(q))));
    }

    // Black circles must overlap a shape, while white circles must not overlap a shape
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(grid.get(p).neq(-1).eq(symbol.isBlack()));
    }

    // All cells not used by shapes must be connected
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(-1));

    const model = await cs.solve(grid);

    // Fill in solved shapes
    for (const [p, arith] of grid) {
        if (model.get(arith) !== -1) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Statue Park",
    parameters: "size: 4",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRNb9s6ELz7VxQ886APf+qWpnEvfmlTuwgMQTBom4mFyKZLSc0DDf/37K4UyJTYS9GgORS0FqPhmBxSHOY/SqElH0ELx9zjPrTQ69Mz9PD32hZpkcnoA78qi53SADj/Mp3yB5HlshfXqqR3MpPI3HHzOYqZzzgL4PFZws1ddDL/RWbJzRy6GPeBm1WiAOBNA++pH9F1Rfoe4NsaA1wC3KR6k8nVvGK+RrFZcIbzfKR/I2R79VOy2ge+b9R+nSKxFgUsJt+lx7onL7fqqay1fnLm5qqyO3fYDRu7CCu7iBx2cRUXdmdvYHeSnM+w7d/A8CqK0fv3Bo4bOI9OUG+p+lSX0YmFAxhmDJNd7ifr+8AGHXbo0g4Cl3YwcWmHznGHTu0odGnHOEJHO3ZqJ07tBFfc0sJmTGlLAqoL2DFuQqqfqHpUB1RnpLmhek/1mmqf6pA0I9zz3/4qb2QnDvoU8Nc2+PNvSS9m8504SgZXActVtspL/SA2cLDppoCzC9yh3K+ltqhMqWOWHmxd+nhQWjq7kJTbR5d+rfS2NfqzyDKLqO49i6rOg0UVGvJ38S60Vs8WsxfFziIusmqNJA+FbaAQtkXxJFqz7Zs1n3vsf0ZPHMI9G/67Z//SPYufwHtvuX5vduj0Ku2MPtCO9APrTHnNd4IOfCfSOGE31cA6gg1sO9tAdeMNZCfhwP0i5DhqO+foqh11nKqTdpzqMvBx0nsB",
            answer: "m=edit&p=7VRLb9swDL77Vww662D5Fdu3rm12yR5dMhSBEQRO4jZGnSjzYx0c+L+PpJImirVLsWI7DLJJ+iMt0pQ/Vt+btMz4AJYbcpsLWK7t0R3YeB3XJK+LLH7Hr5p6LUswOP88HPKHtKgyKzlEzax9G8XtHW8/xAkTjDMHbsFmvL2L9+3HuJ3ydgwuxgVgIxXkgHl7Mu/Jj9a1AoUN9qeDDeYUzGVeLotsPlbIlzhpJ5xhnvf0NppsI39k7FAHPi/lZpEjsEhr+Jhqne8OnqpZyaeGHVN0vL1S5Y4N5bqnct2Xcl1zuY5e7ugNyo1mXQdt/woFz+MEa/92MsOTOY73HdaFUpCcxnvm+rBNyPV+Mk8A6vTQwBTrO6ZYPzLFBsZ9A2PswDXFhsIUGxpjI2Ns5PdjoRlDaolDcgId461L8oakTdInOaKYW5L3JK9JeiQDihlgz+FUzvcIem+fH4bKAIfEHI/FApjjKxUoNVAqIuXapPCYUCmfp3y+8uGxoFI+PyQVKF+g3gsUiI0WqoeoVHbsklD/yEtD8GM7K3E8GhPH5f/5p5mVsPE63WUMBgqrZDGvmvIhXQI9aN5wwrbNZpGVGlRIuSvyrR6XP25lmRldCGarR1P8Qpari92f06LQgIqmpwapv0qD6jLXntOylM8asknrtQacMV7bKdvWegF1qpeYPqUX2Tanb+4s9pPRnbgwrd3/0/ovTWs8AvvVM/vNhtW/VQ79vbI0Uh9gA/sBNbL8gPeIDniP0piwz2pADcQG9JLbAPXpDWCP4YD9huS46yXPsapLqmOqHtsx1Tnhk5n1Cw==",
        },
    ],
});
