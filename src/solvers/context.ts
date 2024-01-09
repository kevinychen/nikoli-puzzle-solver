import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Implies, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded cells cannot be horizontally or vertically adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
    }

    // An unshaded number shows the amount of orthogonally adjacent shaded cells
    for (const [p, text] of puzzle.texts) {
        cs.add(
            Implies(
                grid.get(p).eq(0),
                Sum(...puzzle.points.edgeSharingPoints(p).map(q => grid.get(q))).eq(parseInt(text))
            )
        );
    }

    // A shaded number shows the amount of diagonally adjacent shaded cells
    for (const [p, text] of puzzle.texts) {
        cs.add(
            Implies(
                grid.get(p).eq(1),
                Sum(
                    ...puzzle.points
                        .vertexSharingPoints(p)
                        .filter(p => !puzzle.points.edgeSharingPoints(p).some(q => q.eq(p)))
                        .map(q => grid.get(q))
                ).eq(parseInt(text))
            )
        );
    }

    // All unshaded cells on the board form an orthogonally connected area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(0));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Context",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRBb5swFMfvfIrKZx8wNAnh1nXNLhlb10xVhVDkJLRBhbgzsE6O8t37/KACG3bYYV0PE/LT4+eH/bfN3+WPmsuUBvD4AXUpg8c/97B57hyb2z6rrMrT8Ixe1NVeSEgo/bJY0Huel6kTt1WJc1TzUF1T9SmMCSOUeNAYSai6Do/qc6giqm6gi1AGbNkUeZBedekt9uvssoHMhTxqc0jvIN1mcpun62VDvoaxWlGi5/mAX+uUFOJnSlod+n0rik2mwYZXsJhynz21PWW9E491W8uSE1UXjdybEbl+J1enjVydjcjVq/jLcufJ6QTb/g0Er8NYa//epUGX3oRHiFF4JF6gP4WTYc3ZEN97XforwIoemGCF3wO+Bm4PTOxPZhaY2mA2tUAwAKijN+3ctQGzAHNRSG91jGFNb1jGTLGwLwx35w7jAqOHcQWbR5WP8SNGF+ME4xJrrjDeYrzEeI5xijUzvf1/dEBvICf2puj27pm87XvixCSqi00qzyIhC54TuDtIKfJ1Wct7vgUn4NUCPzuwA1YaKBfiKc8OZl32cBAyHe3SMN09jNVvhNxZoz/zPDdAc1UaqPG0gSoJhu29cynFs0EKXu0N0DO3MVJ6qEwBFTcl8kduzVZ0az455BfBFvtwMfv/L+Z/dDHrI3Dfm/vfmxz8e4UctT7gEfcDHXV5ywdGBz6wtJ5w6GqgI8YGansb0NDeAAcOB/Ybk+tRbZ9rVbbV9VQDt+up+oaPE+cF",
            answer: "m=edit&p=7VRNc5swEL3zKzI66yCBwcAtTeNeXLep08lkGI8H2yRmAlbKR9PBw3/vaoWDJeihh6Y9dBjtrp52tU8Su+W3Oi4S6sPn+JRRDp8zsXHYLMDBuu82rbIkvKCXdbUXBRiUfprN6EOclYkVdV4r69gEYXNDmw9hRDihxIbByYo2N+Gx+Rg2C9osYYlQDthcOdlgXvfmHa5L60qBnIG96Gww78HcpsU2S9ZzhXwOo+aWEpnnHUZLk+Tie0I6HnK+FfkmlcAmruAw5T597lbKeieeanJK0dLmUtFdjtB1errOK11nnK795+kGq7aFa/8ChNdhJLl/7U2/N5fhsZW8jsT2ZSi8DFdvQxz7dPQT4BuAix7OGeBIgJ0BrhkyNQDPBKaeAfgDwDfSBswEuAFw5hqn45wb23Kuk4V74Xg79yhnKG2Ut3B5tHFQvkfJULoo5+hzjfIO5RXKCUoPfaby+uGBzvfwBtELlIqFyrCULwUXAhTtANWEKTVB5XKlXKWmqDy1NvVR+SrAV2u+2iVQcZyxTqsQzrs5P81l1OudqHuQZ2ytyPawVfSf+7bzlRWRRZ1vkuJiIYo8zgg0HlKKbF3WxUO8hTLCvkQRO6CnBmVCPGfpQfdLHw+iSEaXJJjsHsf8N6LYGbu/xFmmASX2WQ1SDUGDqiLV5nFRiBcNyeNqrwFnnUHbKTlUOoEq1inGT7GRLe/P3FrkB8EROdDVnf9d/S91dfkE7Ld6+5t0sn+LDv69ohgtfYBHqh/Q0Srv8EGhAz4oaZlwWNWAjhQ2oGZtAzQsbwAHFQ7YL4pc7mrWuWRllrpMNah2meq84KOV9RM=",
        },
    ],
});
