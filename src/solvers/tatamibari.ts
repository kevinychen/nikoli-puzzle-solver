import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async (
    { And, Distinct, Iff, Implies, Not }: Context,
    puzzle: Puzzle,
    cs: Constraints,
    solution: Solution
) => {
    // Draw lines over the dotted lines to divide the board into rectangles
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, puzzle.texts.size() - 1));
    const dimensionsGrid = new ValueMap(puzzle.texts.keys(), p => ({
        top: cs.int(0, p.y),
        bottom: cs.int(0, puzzle.height - p.y - 1),
        left: cs.int(0, p.x),
        right: cs.int(0, puzzle.width - p.x - 1),
    }));

    // Each region contains exactly one clue
    for (const [p, arith] of grid) {
        cs.add(
            ...[...dimensionsGrid].map(([q, { top, bottom, left, right }], i) => {
                return Iff(
                    arith.eq(i),
                    And(
                        Implies(p.y < q.y, top.ge(q.y - p.y)),
                        Implies(p.y > q.y, bottom.ge(p.y - q.y)),
                        Implies(p.x < q.x, left.ge(q.x - p.x)),
                        Implies(p.x > q.x, right.ge(p.x - q.x))
                    )
                );
            })
        );
    }

    for (const [p, { top, bottom, left, right }] of dimensionsGrid) {
        if (puzzle.texts.get(p) === "|") {
            // A vertical line indicates that the region is a rectangle where the height is larger than the width
            cs.add(top.add(bottom).gt(left.add(right)));
        } else if (puzzle.texts.get(p) === "-") {
            // A horizontal line indicates that the region is a rectangle where the width is larger than the height
            cs.add(top.add(bottom).lt(left.add(right)));
        } else if (puzzle.texts.get(p) === "+") {
            // A plus sign indicates that the region is a square
            cs.add(top.add(bottom).eq(left.add(right)));
        }
    }

    // Region borders must not form 4-way intersections
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Not(Distinct(...vertex.map(p => grid.get(p)))));
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Tatamibari",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTfb5swEMff+Ssqv86V+JF0CW9d1+wlY+uSqaoQipyENqgQdwbWyVn+994dTGBg0vawLQ+Tw+n4+Gx/Tfx1/qUUKuZjaN6E29yB5roTekY2/n60ZVKksX/GL8tiJxUknH+Yzfi9SPPYCuuqyDroqa9vuH7nh8xhnLnwOCzi+sY/6Pe+DrheQBfjDrB5VeRCet2kt9SP2VUFHRvyoM4hvYN0k6hNGq/mFfnoh3rJGa7zhkZjyjL5NWa1DnzfyGydIFiLAjaT75Knuicvt/KxrGud6Mj1ZSV3MSDXa+RiWsnFbEAu7uIPy51GxyN89k8geOWHqP1zk06adOEfIAb+gbkjHPoKtFT/DXOnCL43wHM6YGQjOG8BGtKaY0xD2uDCmAPWdkjBHcUZRZfiEgRy7VF8S9GmOKY4p5prircUryiOKF5QzWvc4m99hL8gJ3QrP2Eb/1oWWSELymwdq7NAqkykDBzFcpmu8lLdiw2cDzIcHAFge6o0UCrlU5rszbrkYS9VPNiFMN4+DNWvpdp2Zn8WaWqA6vowUHXSDVQoOMatd6GUfDZIJoqdAVpH3pgp3hemgEKYEsWj6KyWNXs+Wuwboyf04Lry/l9X/+i6wr/APjW/npocOr1SDVof8ID7gQ66vOY9owPvWRoX7Lsa6ICxgXa9Dahvb4A9hwP7iclx1q7PUVXX6rhUz+24VNvwYWS9AA==",
            answer: "m=edit&p=7VRdb5swFH3nV1R+nSdhm6SBt65r9pJl65KpqlAUkYQ2qBA6A+tEyn/fvTYpGJi0PezjYXK4Ojm+vvdgc5x9KQIZ0hEMMaE2ZTA4n6jHsfF3Gssoj0PvjF4U+T6VACj9MJ3SuyDOQsuvs1bWsXS98pqW7zyfMEIJh4eRFS2vvWP53ivntFzAFKEMuJlO4gCvGnij5hFdapLZgOc1BngLcBvJbRyuZ5r56PnlkhLs80atRkiS9GtIah34f5smmwiJTZDDy2T76LGeyYpd+lCQU4uKlhda7mJArmjkihe5Ylgu//1y3VVVwbZ/AsFrz0ftnxs4aeDCO1ao60i4g0tfgRZ9NoS7SDw3hGAdwrGReN0i3E6NEesSY6MG9GZKwa2KUxW5iksQSEuh4lsVbRVHKs5UzpWKNypequioOFY55/iKsAntGmNzNXEFnAwnnqDEdQAKBYGijLEaQwrTKcC1MObU+QxznBpPALtNPrdr7DaYg6l4XZ9jTl2TQ00uWvmTJkec1kJ9ca6xgDoCe+lDfNlOvVWL1tbq7cStqiyfa0/jGP0cWlk+mRfJJpRn81QmQUzA1SRL43VWyLtgC9+oMj1V3EFlGlScpo9xdDDzovtDKsPBKSTD3f1Q/iaVu071pyCODSJTV5hBabcZVC4j438gZfpkMEmQ7w2iZTujUnjITQF5YEoMHoJOt6R558oi34h6fAFXpvh/Zf6lKxOPwP6li/OPXGH/lhz19aZy0PpAD7gf2EGX13zP6MD3LI0N+64GdsDYwHa9DVTf3kD2HA7cD0yOVbs+R1Vdq2OrntuxVdvw/sr6Dg==",
        },
    ],
});
