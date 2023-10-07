import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to divide all unshaded cells into regions
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // All shaded cells are orthogonally adjacent to exactly one other shaded cell
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.eq(1), Sum(...puzzle.points.edgeSharingPoints(p).map(p => grid.get(p))).eq(1)));
    }

    // Cells with letters cannot be shaded
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // All identical letters must be in the same region
    // There can not be a region without any letters
    // Different letters must be in different regions
    const letters = new ValueMap([...puzzle.texts].map(([p, text]) => [text, p]));
    const roots = new ValueSet([...letters.values()]);
    const instance = cs.addConnected(
        puzzle.points,
        p => Or(grid.get(p).eq(1), roots.has(p)),
        (p, q) => And(grid.get(p).eq(0), grid.get(q).eq(0))
    );
    for (const [p, text] of puzzle.texts) {
        cs.add(instance.get(p).is(letters.get(text)));
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
    name: "Dominion",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTNbts8ELzrKQKeedCPIye6OW7ci6uvqV0EgSAYtK3EQiQzpaSmoOF3z+5KgERJPbRA2xw+EFyMh0vu0Nph8a0SKuE+DO+K29yB4fo+TWcyoWk3Y52WWRJc8FlVHqQCwPl/iwV/FFmRWFGTFVsnfR3oO64/BhFzGGcuTIfFXN8FJ/0p0CHXK1hi3AFuWSe5AG9beE/riOY16diAwwYDfAC4S9UuSzbLmvkcRHrNGda5od0IWS6/J6zRgb93Mt+mSGxFCZcpDulLs1JUe/lcNblOfOZ6Vstdjcj1WrkIa7mIRuTiLf6w3Ov4fIa//QsI3gQRav/awqsWroITxDA4MdfFrTPQUn8b5k6QuOkQPhLzlpjSlk7GtL9lam6BUg4VfKC4oOhSXIMerj2KHyjaFC8pLinnluI9xTnFCUWfcqZ4o1+681+QE7kuGagel7+PYytiYZVvE3URSpWLjIGtWCGzTVGpR7GDJiHXQR8Ad6RMg8qkfMnSo5mXPh2lSkaXkEz2T2P5W6n2vdNfRZYZRP2KGFTd7gZVKujlzm+hlHw1mFyUB4Po9L1xUnIsTQGlMCWKZ9Grlrd3PlvsB6MZefBmef+/Wf/ozcJPYL83F783OdS9Uo1aH+gR9wM76vKGHxgd+IGlseDQ1cCOGBvYvreBGtobyIHDgfuJyfHUvs9RVd/qWGrgdizVNXwUW28=",
            answer: "m=edit&p=7VTfb5swEH7nr6j87IdgEtLylmbNXrJsXTJVFYoiJ6ENKsSdgXUi4n/f3ZmVGNjDJu3Hw2T5fP589n0H/px9LqSOuA/Nu+QD7kITvk/dHQ6pD+q2ivMkCi74pMgPSoPD+fvZjD/IJIucsI5aO6fyKihvefk2CJnLOBPQXbbm5W1wKt8F5YKXS1hi3AVsboIEuDeNe0fr6E0N6A7AX9Q+uPfg7mK9S6LN3CAfgrBccYZ5rmk3uixVXyJW88D5TqXbGIGtzKGY7BA/1ytZsVdPBfueouLlxNBd9tD1GrreK12vn674/XSv1lUFn/0jEN4EIXL/1LiXjbsMThXyOjEhcOsEuJh/w8QQgeszwEdg2gBj0YoYt7eM7S2QyqWE92RnZAXZFfDhpUf2DdkB2RHZOcXckL0jOyU7JOtTzBgrgprPz/A7uxdkDQuTYYnFeywAimJEg2dmnpkNhRl8GkZmNjIz34SMcXgty5SCNCsnFIIEZNro1/21E7JFkW4jfbFQOpUJA1mxTCWbrNAPcgeXhFTHCTtSpAUlSj0n8dGOix+PSke9SwhG+8e++K3S+9bpLzJJLCCjV8SCzHW3oFzH1lxqrV4sJJX5wQLO7r11UnTMbQK5tCnKJ9nKljY1Vw77yqiHHrxZ3v836y+9WfgLBj/1cv2RR+XfokO3V+le6QPco35Ae1Ve4x2hA96RNCbsqhrQHmED2tY2QF15A9hROGA/EDme2tY5smpLHVN11I6pzgUfrp1v",
        },
    ],
});
