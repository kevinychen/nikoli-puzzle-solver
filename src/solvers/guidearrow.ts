import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded cells cannot be horizontally or vertically adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
    }

    // All unshaded cells on the board form an orthogonally connected area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(0));

    // Unshaded cells cannot form a loop
    const tree = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        const terms = puzzle.points
            .edgeSharingPoints(p)
            .map(q => ({ q, term: And(grid.get(p).eq(0), grid.get(q).eq(0)) }));
        cs.add(Or(tree.get(p).eq(1), Sum(...terms.map(({ q, term }) => And(term, tree.get(q).lt(tree.get(p))))).eq(1)));
        cs.add(...terms.map(({ q, term }) => Implies(term, tree.get(q).neq(tree.get(p)))));
    }

    // Cells with a clue cannot be shaded
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).eq(0));
    }

    // An arrow indicates the only direction in which one could begin a path to the star without going through a shaded cell or backtracking
    for (const [p, symbol] of puzzle.symbols) {
        const [v] = symbol.getArrows();
        if (v) {
            const q = p.translate(v);
            cs.add(grid.get(q).eq(0), tree.get(p).gt(tree.get(q)));
        } else {
            cs.add(tree.get(p).eq(1));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Guide Arrow",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRRb9o8FH3nV3zysx9wAh3kre3KXli/dTAhFEWRAbdEDZg5yToZ8d97702mYOK9TKrWhynk5OT4Yh87Pi6+V9IoPoArHPE+F3iN4Qn3WOCv31zzrMxV9B+/rsqtNkA4/38y4Y8yL1QvbqqS3tGOI/vA7acoZoJxFsAtWMLtQ3S0nyO75HYGTYwL0KZ1UQD0rqULakd2W4uiD/y+4UCXQItSmvrtSxTbOWc4xg39Eynb6R+KNR7wfa13qwyFlSxhIsU2OzQtRbXRz1VTK5ITt9e11ZnHathaRVpbReaxijNAq+vMrHOVTt/A7jg5nWDJv4LhNIrR+7eWjlo6i46A94SCcBkdWSCgG8GZNEa/pDfpghyy4ArkYUcOUQ7AwK+VZ4PQUwh9T2iEgHAOBrgNCT8S9gmHhFOquSNcEN4SDgivqOYDTuGPJ/lGdmIxqrPCh/5n0ovZbCsPikEmWKHztKjMo1zDV6bIwDqCtq92K2UcKdf6kGd7ty572mujvE0oqs2Tr36lzeai9xeZ545QHwCOVO9XRyoNbMazd/rijrKT5dYRzjau05Pal64B3E5O38/yYrRdO+dTj/1kdMchHDjhvwPnLxw4uPz995bI92aHdq423tiD7Ek+qN6EN3on5KB34owDdhMNqifUoF7mGqRutEHspBu03wQce73MOLq6jDkO1Uk6DnUe9jjpvQI=",
            answer: "m=edit&p=7VRNj5swEL3zKyqffcCQpAm3/Uov6cc2qaIIIeQk7AYtxKmBbkXEf+/MQJcY6GWlVXuoCOPx82TmjfFz9r2QOuIjeNwpt7nAZ2bTOxP4s5tnFedJ5L3jV0V+UBoczj/P5/xBJllk+U1UYJ3LmVfe8/KD5zPBOHPgFSzg5b13Lj965YaXS1hiXAC2qIMccO9ad03r6N3UoLDB/9T44G7AzXKp69kXzy9XnGGNa/onuixVPyLWcMD5TqXbGIGtzKGR7BCfmpWs2Kungv1OX/Hyqqa6HKDqtlTdF6ruMFWnobqL9S6JwsUb0J0FVQVb/hUIh56P3L+17rR1l965Ql5oBdmNd2aOgDSCM6m1eg6vwzUxZM4E4HEPdhF2eLvzbOQOBELuOVVwyK6AAC9dsrdkbbJjsguKuSO7JntDdkR2QjHvsQVo8jLHpPfvy97qCtAzEzPmQYNOPbhjGkZOPeCs3okXnsihsnwxrYXAx8NjYPlseZCniMGBZ5lKwqzQD3IHn5D0wAk7Fuk20gaUKHVK4qMZFz8elY4GlxCM9o9D8Vul953szzJJDCAjdRtQfRgNKNexMafPaSCpzA8GcHEqjUzRMTcJ4Fkxcj/JTrW07bmy2E9Gr+/CbeL+v03+wm2C22+/+k55M/X/W3To5Co9KHuAB5QP6KDCG7wncsB7csaCfUUDOiBqQLu6BqgvbQB76gbsDwLHrF2NI6uuzLFUT+lY6lLsfmD9Ag==",
        },
    ],
});
