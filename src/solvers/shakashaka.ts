import { Constraints, Context, Point, Puzzle, Solution, Symbol, ValueMap, Vector } from "../lib";

const solve = async ({ And, Implies, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade a right triangle in some empty cells, each of which occupies exactly half the cell it's in
    // SW means a black triangle with an SW corner, i.e. a line going from NW to SE with the bottom left shaded
    const values = ["NW", "SW", "SE", "NE", "WALL"];
    const grid = new ValueMap(puzzle.points, _ => cs.choice(values));
    for (const [p, arith] of grid) {
        cs.add(arith.is("WALL").eq(!puzzle.points.has(p) || puzzle.shaded.has(p)));
    }

    // Each unshaded area must be rectangular in shape. The rectangle can be upright, or rotated at a 45º angle
    const boxValues = ["NW", "NE", "SW", "SE"];
    for (const vertex of puzzle.points.vertices()) {
        // In every 2x2 box, if there are 3 empty cells, the 4th is either empty or contains a
        // triangle in the corresponding direction as its position in the box
        for (const [i, p] of vertex.sort(Point.compare).entries()) {
            cs.add(
                Implies(
                    And(...vertex.filter(q => !q.eq(p)).map(q => grid.get(q).eq(-1))),
                    Or(grid.get(p).eq(-1), grid.get(p).is(boxValues[i]))
                )
            );
        }
    }
    const dirs = [Vector.S, Vector.E, Vector.N, Vector.W];
    for (const [p] of grid) {
        // An SW must have either a SE to its east, or a blank to its east and an SW to its
        // southeast. Similar logic applies for the other directions.
        for (const [i, v] of dirs.entries()) {
            cs.add(
                Implies(
                    grid.get(p).eq(i),
                    Or(
                        grid.get(p.translate(v))?.eq((i + 1) % 4) || false,
                        And(
                            grid.get(p.translate(v))?.eq(-1) || false,
                            grid.get(p.translate(v).translate(dirs[(i + 3) % 4]))?.eq(i) || false
                        )
                    )
                )
            );
        }
    }

    // A number in a cell represents how many of the (up to 4) cells orthogonally adjacent to the clue contain triangles
    for (const [p, text] of puzzle.texts) {
        cs.add(
            Sum(...puzzle.points.edgeSharingPoints(p).map(p => And(grid.get(p).ge(0), Not(grid.get(p).is("WALL"))))).eq(
                parseInt(text)
            )
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved triangles
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (puzzle.points.has(p) && value >= 0) {
            solution.symbols.set(p, new Symbol("tri", value + 1));
        }
    }
};

solverRegistry.push({
    name: "Shakashaka",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTRb5s+EH7PX1H52Q8YSEp467pmL122LpmqykIRSWiLCnFnYJ2I8r/37myNODDp97L9OmkC350/H74PzHfVtybVGRce3kHEwcMVioiGH01oePZa5nWRxWf8oqkflYaA80+zGb9PiyobSZuVjPbtNG5vePshlkwwznwYgiW8vYn37ce4nfN2AUuMC8CuTZIP4VUX3tI6RpcGFB7EcxOHEN5BuMn1pshW12ajz7Fsl5xhnXf0NIasVN8zZnngfKPKdY7AOq3hZarH/NmuVM1WPTU2VyQH3l4YuosBukFHF0NDF6MBuvgWv5nuNDkc4LN/AcKrWCL3r10YdeEi3rPAY7HgLJgYNyUXmtm5b5yZRWZtOiYnvMh4Yb1vkkUgjA/tfGzXJxaf4PNQfI7FYWfJAjhD80tQRQfAopKFHYDlJfM6gIi4CFJydiFSzjZET+K/+BNBgkdPAUUR78HekZ2R9cku4fPxNiD7nqxHdkz2mnKuyN6SvSQbkp1QzjkewH88IvOt/gAdGRi9u9f478OSkWSLRt+nmwzkMW/KdabP5kqXacGgH7FKFavKrsfUrkBAgO0o04EKpZ6LfOfm5Q87pbPBJQSz7cNQ/lrp7cnuL2lROIBpwA5k+oQD1RqawNE81Vq9OEiZ1o8OcNQwnJ2yXe0SqFOXYvqUnlQru3c+jNgPRkMG0OyDf83+f2r2eATeW+snb40O/b1KD0of4AH1Azqocov3hA54T9JYsK9qQAeEDeiptgHqyxvAnsIB+4XIcddTnSOrU6ljqZ7asdSx4GUyegU=",
            answer: "m=edit&p=7Vbdb9MwEH/vXzH52Q++2Pl8G2PjZRRGhyYUVVPaZVu1tBlpy1Cq/u/Y59DG5yDxMgESSnN2fr6vnO+Xev11WzQlB2F+MuF61JeCBO8gifAW3XW92FRldsJPt5vHutETzj9cXPD7olqXo7zTmo52bZq1V7x9l+UMGGeBvoFNeXuV7dr3WTvm7UQvMQ4au7RKgZ6eH6c3uG5mZxYEoedjO1d6+kVP54tmXpW3l9bRxyxvrzkzcd6gtZmyZf2tZF0e5nleL2cLA8yKjX6Z9ePiuVtZb+/qp22nC9M9b09tupOBdOUxXXlIVw6nG7x+uul0v9dl/6QTvs1yk/vn4zQ5TifZjknBMuBMRnZIcVD2KQ7sYJ8Su5aGOIBI7AjdGFhlkGBH1T2H3XrU4ZGx35ty7DBqzqTeQ9sSGNEBTNCcqSNgwudMHAFMxEUgIV4wKccNppebXjwgEThWOkXIdnuzWUZeoAxQXuvy8VaifItSoAxRXqLOOcoblGcoFcoIdWKzAXqL+j4iz3qM0mZhI0x+ZoT7loecbZoFdhCTSgPQB0ylVB+IqElMTRJqkhITRaMoGkXRKIpGUcap7AGhIBqhJE5NE+VBH6A+IuojCqiGpBox0cDu66ceU5M4pCb0beOYZJoIYpJExGmSUA1a9ZS+XAqkQGlAwqaSOEXi9J2CEMQGBBAjEAGJDILuDQjl+aFlsiR1ogPtJADaSgAR9Qx0zyzZHc8BrRYEtFz4tSJWtMUAKeZY4WfEsZJefaRXH+nVR3r1kbQpAMnp+FFezkpSz8hPxzMS1PGsvBqqxNNJafTQ65bQ65bQ2wvkqWMVUT7YD69jFdFuhoi2M/6P9KwOn2Xzyd2PcmnPLu4V/nvYdJSzyba5L+al/qsfb5ezsjkZ182yqJg+W7F1Xd2uu/UMj14csRVqOlBV18/VYuXqLR5WdVMOLhmwvHsY0p/VzR3x/lJUlQOs8TDpQPbM40Bm+/rPRdPULw6yLDaPDtA7/DieytXGTWBTuCkWTwWJtjy+837EvjO8dZ/p0+//g+sfOriaLRC/eXwlh6TXPKr9Xelg99bNIPU1PMB+jQ6yvMM9omvco7QJ6LNaowPE1ijltoZ8emvQY7jGfkFy45Xy3GRFqW5CeWw3ofqEz6ejHw==",
        },
    ],
});
