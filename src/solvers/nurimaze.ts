import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // You're given a grid divided into tiles
    // Shade some tiles on the board to form a maze
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // A tile is either completely shaded or unshaded
    for (const region of puzzle.regions()) {
        for (const p of region) {
            cs.add(grid.get(p).eq(grid.get(region[0])));
        }
    }

    // Tiles containing a clue cannot be shaded
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).eq(0));
    }

    // There can not be a 2x2 square of all shaded or all unshaded cells
    for (const vertex of puzzle.points.vertices()) {
        for (const i of [0, 1]) {
            cs.add(Or(...vertex.map(p => grid.get(p).eq(i))));
        }
    }

    // All unshaded cells form an orthogonally contiguous area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(0));

    // Unshaded cells cannot form loops
    const tree = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        const terms = puzzle.points
            .edgeSharingPoints(p)
            .map(q => ({ q, term: And(grid.get(p).eq(0), grid.get(q).eq(0)) }));
        cs.add(Or(tree.get(p).eq(1), Sum(...terms.map(({ q, term }) => And(term, tree.get(q).lt(tree.get(p))))).eq(1)));
        cs.add(...terms.map(({ q, term }) => Implies(term, tree.get(q).neq(tree.get(p)))));
    }

    // There is exactly one path between S and G that doesn't require backtracking
    const path = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    for (const [p, arith] of path) {
        cs.add(Implies(arith.eq(1), grid.get(p).eq(0)));
        if (puzzle.texts.has(p)) {
            cs.add(arith.eq(1));
        } else {
            cs.add(Implies(arith.eq(1), Sum(...puzzle.points.edgeSharingPoints(p).map(p => path.get(p).eq(1))).eq(2)));
        }
    }

    // Circles must be part of this path, while triangles must not
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(path.get(p).eq(1).eq(symbol.isCircle()));
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
    name: "Nurimaze",
    keywords: ["Nurimeizu"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZNj9s2EL37VwQ88yCS+r6lqTeXrdvUWwSBYCxkrxIbkVdb2W4KLfzf84YcriRbRdECbXMoBFFPT8OZxyGH1OHXU9lWMsVlUhlIhcuE2t46yOwd8HW3O9ZV/kq+Ph23TQsg5Y83N/JjWR+qWcFWq9lzl+XdO9m9zQuhhBQatxIr2b3Ln7sf8m4uuyU+CanA3TojDTjv4Xv7ndAbR6oAeMEY8APgsd2dnu5vHfFTXnR3UlCY72xngmLf/FYJlkHvm2a/3hGxLo8Yy2G7e+Ivh9ND8/nEtmp1lt1rp3Y5odb0agk6tYQm1NIgSO1m127q6h+Rm63OZ2T9Zwi+zwvS/ksP0x4u82e0i/xZKKWp7xJi3NyAiYh56xkYKmv+AeZxiG/ghxkXceLI0cDgJ5im2XrgAs5vbAht2zuIlJ2x7fe2DWwb2fbW2sxJe5RJlSiRa7hNsGI9jolHdM+nGCPhVEuVYQSEMzPAIVZ3bLEOogGOpVapwyqV2jifeEodOp86VAOMSomcT2tjnB48YWPYxsAGGfb2Qz7kviH0RKyBcOjtoS30PLSFSKXFCeyzno9YM/Ghx9Afso2hvswTNuzHwL9h/wZxDccl7OOSjY9roNn48WIshsdC4zWcE8phwPYB9CjWoLCj+PwQ1pxbjbxp5jX5YZ/Ev/jEWLw94cD5VBn8v+AY8+viqiwCdvoJ93ooLq8ZrAF869dJ6uLiCczrJIVN6m3IJ/uPae3xGkvQN+G+CfVl+xj7qedj8AnzCXwOcco6yb/HCXDiMcaVcFzCqZtHlSYDTDzbEJ/5nNAu7vOGfAZ+7GTDfbN0YI/cUhX7XHmsaI54LjTNO68B8kn7ibUBr5nXWCcvmHjOA+lRfg1grpm3fRVhFPp7W+5vbBvaNrbbQEI72V/a64Yb2d/bcf5UTqGR+dGFmfs331ezQswfPlWvFk27L2ucEYvTfl21/ftyWz5VAmezODT1/eHUfiw3OGrs0Y3TBNyj7TGi6qZ5qnePY7vdp8emrSY/EVlBxoT9umkfLrx/Ket6RLhfkRHlDpERhQNk9F62bfNlxOzL43ZEDE7Pkafq8TgWcCzHEsvP5UW0fT/m80z8LuxdGPz4mP9/fP6bHx+ageBb2xK+NTl28TbtZOWDnih+sJNFzvxVnYO/qmgKeF3UYCfqGuxlaYO6rm6QVwUO7g9qnLxeljmpuqx0CnVV7BRqWO/FavYV",
            answer: "m=edit&p=7VZdb9s2FH33ryj4zAfxQyTlt65N+pJl65xhKAwjUBK1MSpHmWyvgwL/955LUqZka0A3YB8PgyDy6PDy8vDjXnH7675sK+7wKMczLvAoLf0rs8K/WXxu1ru6mr/ir/e7x6YF4PyHy0v+say31WwZrVazl66Yd+95926+ZIJxJvEKtuLd+/lL9/28u+DdAk2MC3BXwUgCXiT4i28n9CaQIgO+jhjwA+CuXe+fb68C8eN82d1wRsN85zsTZJvmt4pFGfR932zu1kTclTvMZfu4fo4t2/1D83nP+hEOvHsd1C4m1KqkVh3Vqmm1Mqq9X7f3dfW3yC1WhwNW/ScIvp0vSfvPCboEF/OXA+l6YUJI6ruAmLA3YHJi3vUMDIU3/wBzo9EGfrjizNhAjiYGP9k0bc9cwPmlH0L68gYiead8+daXmS9zX155mwvSnhdcWMHmEm5tlrAhPku8kwE7yUWhAy7UAGucbuOxzPIBNlwKF7BwXKrgEzWXOviUWgwwIiXXyUaJiMlGRRsFmzzZD3kd+2royU3CureHNt3z0KZtxBb2ReJzl3jdY+jX0UaZxBNW0Y+CfxX9K4yr8oT7ccmmH1dBs+rni7kolearZFrDLNpn0COiBlGk9SEs49pKrJuMvBTJJ/FHny7ZE86KuI92gA3210acA5sjTnqK41h0BtCWzolTEeOcuHhOHGxcb5Mn/4bOXjxjFn1t7GtVsjci8Qa8jbzVY+xM8t9jC2x7jHlZm7Bz0d4OMPE28UW/JpTF+3XDembiuG6iiH0LN7DH2oosrVWPBe1R3Asp0xkgnyLyAryMvFQDTLxKekR/BsSR930F4QOlVAr3N77UvjQ+DVjKZMh1wzRhxgkipLhj/gpJBKmPSawlMpC0oSp8RYeLKuUrHSvtq1yEKpjkoc0EL8aFKnihraQquLahzWWhCqQLZBHIIvQTmYp1cCBE/BakIGTfY2qkNTnMltL4n3R68n/2ezVbsouHT9Wr66bdlDV+SNf7zV3Vpu/FY/lcMVwE2Lapb7f79mN5j/+avydwzz35HiOqbprnev00tlt/emraarKJyAoyJuzvmvbhxPuXsq5HxNbfe0ZU+GONKPytRt9l2zZfRsym3D2OiMGveuSpetqNBezKscTyc3ky2ibN+TBjvzP/LhVuWer/W9a/c8uiHcj+1F1reJH6azeeb0iH/y05/vA27WTkg54IfrCTQR75szgHfxbRNOB5UIOdiGuwp6EN6jy6QZ4FOLg/iHHyehrmpOo00mmos2CnoYbxvlzNvgI=",
        },
    ],
});
