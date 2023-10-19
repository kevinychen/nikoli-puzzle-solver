import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form regions of unshaded cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Each region contains exactly one number
    cs.addConnected(
        puzzle.points,
        p => Or(puzzle.texts.has(p), grid.get(p).eq(1)),
        (p, q) => And(grid.get(p).eq(0), grid.get(q).eq(0))
    );

    // A number indicates the size of the region that contains it
    for (const [p, text] of puzzle.texts) {
        cs.addContiguousArea(puzzle.lattice, puzzle.points, p, p => grid.get(p).eq(0), parseInt(text));
    }

    // You cannot shade a cell with a number
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // Shaded cells must form rectangular blocks with a width of 1
    const maxLength = Math.max(puzzle.height, puzzle.width);
    const strips: Point[][] = [];
    for (const p of puzzle.lattice.representativeCells()) {
        const bearing = puzzle.lattice.bearings()[0];
        for (let len = 1; len <= maxLength; len++) {
            strips.push(bearing.line(p, len));
        }
    }
    const placements = puzzle.points.placements(strips);
    const sizeGrid = new ValueMap(puzzle.points, _ => cs.int());
    const typeGrid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                arith.eq(0),
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(
                            ...placement.map(p => grid.get(p).eq(1)),
                            ...placement.map(p => sizeGrid.get(p).eq(strips[instance].length)),
                            ...placement.map(p => typeGrid.get(p).eq(type))
                        )
                    )
            )
        );
    }

    // Two blocks of the same size cannot be diagonally adjacent
    for (const [p] of grid) {
        for (const q of puzzle.points.vertexSharingPoints(p)) {
            if (!puzzle.points.edgeSharingPoints(p).some(r => r.eq(q))) {
                cs.add(sizeGrid.get(p).neq(sizeGrid.get(q)));
            }
        }
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
    name: "Nuribou",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb5swFH3nV0R+9gMfyZbylnbNXjL2kUxVhVDkJLRBhbgzsE6O8t977zUVMTBpe9jWh8nh6HB8bR/HPpTfaqFSPoEWTLnLPWi+P6Vn7OLvpa2yKk/DEZ/V1V4qIJx/nM/5ncjL1ImbqsQ56otQz7h+H8bMY5z58Hgs4fpzeNQfQh1xvYQuxj3QFqbIB3rd0hvqR3ZlRM8FHjUc6C3Qbaa2ebpeGOVTGOsVZ7jOJY1Gygr5PWWND3zfymKTobARFWym3GePTU9Z7+RD3dR6yYnrmbG7HLAbtHaRGrvIBuziLv6w3YvkdIK//QsYXocxev/a0mlLl+ERMAqPzPdpKByNZw6HBQEqZ8LYQ2HyIsBAj4bfEs4JfcIVzM51QPiO0CWcEC6o5prwhvCKcEz4hmreor/f2sFfsBP7JgzYJr/GEidmUV1sUjWKpCpEziAOrJT5uqzVndjC4VJa4PxAO1ClJeVSPubZwa7L7g9SpYNdKKa7+6H6jVS7zuxPIs8twWTfksw1taRKwR08exdKySdLKUS1t4Sz+2rNlB4q20AlbIviQXRWK9o9nxz2g9ETB/CtCf5/a/7RtwaPwH1teX1tduj2SjUYfZAH0g/qYMobvRd00HuRxgX7qQZ1INigdrMNUj/eIPYSDtpPQo6zdnOOrrpRx6V6acelzgMfJ84z",
            answer: "m=edit&p=7VRLc5swEL7zKzI668DDTm1ubhL34tKH3clkGMYj2yRmAlYqoOng4b93d4WDBXQmPfRx6AitVp9W2k9In/KvpVAxH0PxJtzmDhTXnVAd2fidyiop0ti/4LOy2EsFDucf5nN+L9I8tsImKrKO1dSvZrx654fMYZy5UB0W8eqTf6ze+1XAqyUMMe4AttBBLrg3rXtL4+hdadCxwQ8aH9w7cLeJ2qbxeqGRj35YrTjDPG9pNrosk99i1vDA/lZmmwSBjShgM/k+eWpG8nInH0t2SlHzaqbpLgfoei1d74WuN0zX/f10p1Fdw2//DITXfojcv7TupHWX/rFGXkfmujQVjsbRh8M8D5EzYOQgMD4BMNGh6Xdk52RdsitYnVce2WuyNtkx2QXF3JC9JXtFdkT2kmLeID/Ywfkal73ZAVnNQmdY4laAOFD0XGpGtm6a3pSa8QSaF+qaLlKprdDVFx7L+HVeZIUsKLNNrC4CqTKRMrjyLJfpOi/VvdjCAZIiOGEHijSgVMqnNDmYccnDQap4cAjBePcwFL+RatdZ/VmkqQHkpG8D0lfRgAqVGH2hlHw2kEwUewM4u5PGSvGhMAkUwqQoHkUnW9buubbYd0Y19OA98f6/J3/pPcEjsH/pVfkjT8S/RYdur1SD0gd4QP2ADqq8wXtCB7wnaUzYVzWgA8IGtKttgPryBrCncMB+InJctatzZNWVOqbqqR1TnQs+jKwf",
        },
    ],
});
