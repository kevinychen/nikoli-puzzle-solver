import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ Distinct }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place an arrow in every empty cell
    const directions = puzzle.lattice.edgeSharingDirections();
    const grid = new ValueMap(puzzle.points, _ => cs.choice(directions));
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(grid.get(p).eq(-1).eq(symbol.isCircle()));
    }

    // Some arrows are given
    for (const [p, symbol] of puzzle.symbols) {
        const [v] = symbol.getArrows();
        if (v) {
            cs.add(grid.get(p).is(v));
        }
    }

    // Every outlined area contains different arrows
    for (const region of puzzle.regions()) {
        cs.add(Distinct(...region.map(p => grid.get(p))));
    }

    // Following the arrows must lead to one of the circled goals
    cs.addConnected(
        puzzle.points,
        p => puzzle.symbols.get(p)?.isCircle() || false,
        (p, q) => grid.get(p).is(p.directionTo(q))
    );

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (!puzzle.symbols.has(p)) {
            solution.symbols.set(p, Symbol.fromArrow("arrow_N_G", directions[model.get(arith)]));
        }
    }
};

solverRegistry.push({
    name: "Roma",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb9owFH3nV1R+9kM+oCR5azvYC2PrYKqqKEIG0hI1wcxJ1imI/95z7awQkmlSpWl9mEJuDsfXvsfJPc6/l0LFvI/L9bjFbbp8PHH7Nv2s+ponRRoHF/yqLDZSAXD+eTzmDyLN415YZ0W9feUH1S2vPgYhsxlnDm6bRby6DfbVp6Aa8WqGIcZtcBOT5ACOjvBOjxO6MaRtAU9rDHgPuErUKo0XE8N8CcJqzhnVudazCbJM/ohZrYP+r2S2TIhYigKbyTfJrh7Jy7V8KutcOzrw6srInXXIdY9yCRq5hDrk0i7+slw/Ohzw2r9C8CIISfu3I/SOcBbsEac62jreB3vmWFhmyJlQSj4vpotrrZA5l6DdNj3szHYp24Hi010yl5LtVnLf7aChZqw1OTrOIZlXro4fdLR0HOg40TkjqB8OuIflUNpzTpCPTRHyX5HLvb5Bfe47GvnIMzOo0WsOyDfIe0Vwgvdrhm2ZBX2/CbFVB5rutLIbHfs6XmrFQ/oEb/5Ib3s5f5QT2p7xOx90P6NeyEbrx/hiKlUmUjTfbCN2MYPLWS7TRV6qB7FCz+pDAG0Jbltmy1g1qFTKXZpsm3nJ41aquHOIyBhlO/KXUq3PVn8WadogzJHWoExfNqhCwVon/3U3NphMFJsGcWLDxkrxtmgKKERTongSZ9Wy454PPfaT6Rt+s3CO/D9C/80RSp/Aem8efW9ydPdK1Wl90B3uB9vp8ppvGR18y9JUsO1qsB3GBnvubVBte4NsORzcb0xOq577nFSdW51KtdxOpU4NH0a9Fw==",
            answer: "m=edit&p=7VRdb5swFH3Pr6j87AdsQ4J5a7ukL1m2Lp2mCkURSWiDCiHjY52I+O+9tgnE4ElTpWl7mCi3J4eL77Ev5+bfyyALsQ0Xc7GFibi4JW9OxJ/VXA9REYfeFb4ui32aAcD402yGn4I4D0d+k7UanSruVfe4uvN8RBBGFG6CVri6907VR6+a4moJjxAmwM1VEgU47eA3+VygW0USC/CiwQAfAW6jbBuH67liPnt+9YCRqHMj3xYQJemPEDU6xO9tmmwiQWyCAjaT76Nj8yQvd+lLic4lalxdK7lLg1zWyWWtXGaWS/+8XL6qazj2LyB47flC+9cOuh1ceqda6BKRyPjonRC1YJkJRkGWpa/rxfpGKkR0DDQb0hNjNhPZFOu7REwkk0GyzQw0qJlJTVTGB5CMKybjBxktGR0Z5zJnCuonDnZhOSjt0gvELYV4ixh2bYVszKlEHPLUG+JDpy3iCrktAie45zeIpRbkXIewVVqLb0Eou5XRlnEsFU9EC6BJlzsa63vp9Ubtd9n2iYAE3+lO7U4dJuF6QxqaEv2Mz7Rrprne7IZmtrEkc4y0TY2L2OZFbMeQ3TZeHGM98omr5hF2zP9XIx9Nd8/h1SLNkiAGcyz3wTFEMIVQnsbrvMyegi14Sg4pLLlDmWzCTKPiND3G0UHPi54PaRYaHwkyhLKG/E2a7XqrvwZxrBG5HLkapXyjUUUWab/lQWlMEhR7jbgYE9pK4aHQBRSBLjF4CXrVkm7P9Qj9RPKGflkw5/6P+L8z4kULrHcP+vcN2N8Yaf+WHPn1ppnR+kAb3A+s0eUNPzA68ANLi4JDVwNrMDawfW8DNbQ3kAOHA/cLk4tV+z4XqvpWF6UGbhelLg3vr0Zv",
        },
    ],
});
