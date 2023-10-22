import { Constraints, Context, PointSet, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Numbers cannot be shaded
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    const transforms = puzzle.lattice.pointGroup();
    const transformIndices = new ValueMap(puzzle.points, _ => cs.choice(transforms));
    for (const region of puzzle.regions()) {
        const regionPoints = new PointSet(puzzle.lattice, region);

        // Each region must include exactly two units (shaded blocks)
        const [root1, root2] = [cs.choice(regionPoints), cs.choice(regionPoints)];
        cs.add(Or(...region.map(p => And(grid.get(p).eq(1), root1.is(p)))));
        cs.add(Or(...region.map(p => And(grid.get(p).eq(1), root2.is(p)))));
        const instance = cs.addConnected(
            regionPoints,
            p => Or(grid.get(p).eq(0), root1.is(p), root2.is(p)),
            (p, q) => And(grid.get(p).eq(1), grid.get(q).eq(1))
        );

        // These units must have the same shape, counting rotations and reflections as the same
        const partners = new ValueMap(region, _ => cs.choice(region));
        for (const p of region) {
            const choices = [And(grid.get(p).eq(0), partners.get(p).eq(-1))];
            for (const q of region) {
                for (const transform of transforms) {
                    const v = transform(p).directionTo(q);
                    if (!puzzle.lattice.inBasis(v)) {
                        continue;
                    }
                    const inv = [...transforms].find(inv =>
                        puzzle.lattice.edgeSharingPoints(p).every(p => inv(transform(p)).eq(p))
                    );
                    choices.push(
                        And(
                            partners.get(p).is(q),
                            partners.get(q).is(p),
                            transformIndices.get(p).is(transform),
                            transformIndices.get(q).is(inv),
                            grid.get(p).eq(1),
                            instance.get(p).neq(instance.get(q)),
                            ...regionPoints
                                .edgeSharingPoints(p)
                                .map(newP => [newP, transform(newP).translate(v)])
                                .map(([newP, newQ]) =>
                                    Implies(
                                        grid.get(newP).eq(1),
                                        And(
                                            grid.get(newQ)?.eq(1) || false,
                                            partners.get(newP).is(newQ),
                                            transformIndices.get(newP).is(transform)
                                        )
                                    )
                                )
                        )
                    );
                }
            }
            cs.add(Or(...choices));
        }
    }

    // A number indicates the size of the unit that occupies the adjacent cell in the indicated direction
    for (const [p, text] of puzzle.texts) {
        const [v] = puzzle.symbols.get(p).getArrows();
        cs.addContiguousArea(puzzle.lattice, puzzle.points, p.translate(v), p => grid.get(p).eq(1), parseInt(text));
    }

    // Shaded cells must not be adjacent across borders
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
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
    name: "Kuroclone",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRRT9s8FH3vr0B+9kMdJwXyBgz2wrqxMiEUVZVbAq1Ia+YmY0rV/865Ny5p2qBPH9I0HqYo1snx9fW5sc9d/iyMS2UPjz6SXanwBL0evyoM+e3653qWZ2l8IE+KfGodgJRfLy7kvcmWaSfxUcPOqjyOyytZfo4ToYQUAV4lhrK8ilfll7i8leUAU0IqcJdVUAB4XsMbnid0VpGqC9z3GPAW0Dhnn0f3tnDp3UM6Oq1mvsVJeS0F7XfKWQiKuf2VCq+Hvid2Pp4RMTY5ilpOZ09+Zlnc2cfCx6rhWpYnlexBi2xdyyZYySbUIpuqIdmTmZtk6ejyD8g9Hq7X+P3fIXgUJ6T9Rw2PajiIVxj78UoEmpbihFR1RkL3iNA1cRgSEW4IrFO8+nazmg9evV4SVNx+MlXqzTXZrHkzmvfdiub4N6Ih54JFBTxeo0pZah4/8djlMeLxkmPOIV8p3O8A+wQoLQDWHmu9hQNg1MkY7tCBxxQfeRzBJx6HwJHHEWJeMXJGPmeEnJHPGRLe5AQOPY4oD/4YY3gxOgSG8BuWf8ZjyGOPyzqko/1fh799lO/7g/8pJwlQ0euDit6Lh51EnOO8D/rWzU2Gy98v5uPU1d+DqXlKBbqPWNpstCzcvZnAQ9ycYBNwC17RoDJrn7LZohk3e1hYl7ZOEUnXriV+bN3dTvZnk2UNomq2DarqBg0qd7D61jff+AYzN/m0QWy1hUamdJE3BeSmKdE8mp3d5nXN6474LfhNNPyn/7X2v9za6Si6H83jH00O32LrWlsA6JYuALbV7Z7fMzz4PWvThvvuBtticLC7Hge1b3OQe04H94bZKeuu30nVruVpqz3X01bbxk+GnRc=",
            answer: "m=edit&p=7VVRb5swEH7Pr6j87IdgY2h5a7t2L123Lp2mCEURSWmDSuLOwDoR8d93d3YDJFTaKk3bw4QwH5/Pd2fO31F8qxKT8gAueczH3INLBAHdnu/TPXbXbVbmaXTET6typQ0Azj9eXvL7JC/SUeysZqNtfRLVN7x+H8XMY5wJuD024/VNtK0/RPWU1xOYYtwD7soaCYAXLfxK84jOLemNAV87DHAKMDFGP8/vdWXSu4d0fmZnPkVxfcsZxjsjLwjZWn9PmcsH35d6vciQWCQlbKpYZU9upqju9GPFXkI1vD61aU8G0pZt2nKXthxOW7i0l5lZ5un86g+kezJrGvj8nyHheRRj7l9aeNzCSbRtMK8tExKXQoU8WyMmAyRkS4Q+Ev4LAes8Wj19WU2F93aHBHY8XBnrOt7Z2TWvWlPcjjXZv2IN6VxSUoLGW9glryWN72gc06hovCKbC0jf8+B8C4gjYGsCsHRYyg4WgKXDoA4pHEZ75bACnTjsA1YOK7+DwadyPhX4VM6nj1i0sXyHFfoJHAYtqhBwg2cM0z+n0acxoG2FWFoofnfbQX/Dtua7CtqPMsE6QkwoL34KfAT2EdJD2jlp56QlfWkf1lJZE2VNlCOtZWDnAkWP0L6FdnnoSLsgxAX2YO1qiJttRrEQ1Jfspd6OZ6OYXcCpObrWZp3kIKHrar1ITfs+WSVPKYMexgqdz4vK3CdLUCK1OE7chlb0qFzrpzzb9O2yh4026eAUknh4B+wX2tzteX9O8rxHFNSye5TtKT2qNFnvnXTTY9ZJueoRnebS85Ruyn4CZdJPMXlM9qKt2z03I/aD0R1LULH8/4P4yz8ILMX4t34T3ab/tl77C43r30qHTrE2gy0A6IEuAOyg2h1/IHjgD6SNAQ/VDeyAwIHd1zhQhzIH8kDpwL0idvS6r3fMal/yGOpA9RiqK/x4NvoJ",
        },
    ],
});
