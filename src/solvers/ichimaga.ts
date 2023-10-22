import { Constraints, Context, FullNetwork, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines over the dotted lines to connect the circles into one network
    const lattice = puzzle.lattice.dual();
    const points = puzzle.points.vertexSet();
    const network = new FullNetwork(lattice);
    const grid = cs.NetworkGrid(points, network);
    const circles = new ValueMap(
        Array.from(puzzle.junctionTexts, ([vertex, text]) => [Point.center(...vertex), parseInt(text)])
    );
    for (const [p, arith] of grid) {
        if (!circles.has(p)) {
            cs.add(Or(arith.eq(0), arith.isLoopSegment()));
        }
    }
    const root = cs.choice(points);
    cs.addConnected(
        points,
        p => Or(grid.get(p).eq(0), root.is(p)),
        (p, q) => grid.get(p).hasDirection(p.directionTo(q))
    );

    // A line must connect two circles, and can turn no more than once
    cs.addConnected(
        points,
        p => circles.has(p) || Or(grid.get(p).eq(0), Not(grid.get(p).isStraight())),
        (p, q) => !circles.has(p) && !circles.has(q) && grid.get(p).hasDirection(p.directionTo(q))
    );

    // Numbers indicate the total amount of lines that are connected to that circle
    for (const [p, number] of circles) {
        const directionSets = network.directionSets(p);
        cs.add(Or(...directionSets.filter(vs => vs.length === number).map(vs => grid.get(p).is(vs))));
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.borders.add(lattice.edgeVertices(p, p.translate(v)));
        }
    }
};

solverRegistry.push({
    name: "Ichimaga",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRBb5swFMfv+RSVzz5ASdfAreu6XdJsXTJVEUKRk7gNKsSZgXUiynfve89UYMwOkzath4nw8vj52e+P4U/xvRJa8jEcwYR73McjhH84Qx9/XnMs0jKT0Rm/qsqd0pBw/nnGH0RWyFHcFCWjYx1G9R2vP0UxO2e8ORNe30XH+jaql7yewxDjPrApZD7j55DetOk9jWN2baDvQT7D3DPzlpBvUr3J5OrWVH6J4nrBGTZ6T9MxZbn6IZlZg643Kl+nCNaihJspdumhGSmqrXqqmlo/OfH6yuidD+gNWr2YGr2YOXqNuI7cqVnoj8oNk9MJ9v0rCF5FMWr/1qaTNp1HR4iz6Mguxzg1AC0c9xQWnARIxl0S9mtCqrEI1eAdvxLfmyCCp94g6OhT3+VrXxiwnp3p7VJc26GkwaWDtUZLD4OSj6TnnOICtobXAcUPFD2KFxSnVHND8Z7iNcUxxXdUc4mb+1vb392SvyQn9ifGyfxi+D8ZxWxW5Wupz2ZK5yKDF2u+EwfJwMKsUNmqqPSD2MD7SA6HVw7YnmZYKFPqkKV7uy593CstB4cQyu3jUP1a6W1v9WeRZRYwnysLmadroVKDbTrXQmv1bJFclDsLdCxmrST3pS2gFLZE8SR63fL2nk8j9pPRGQfwfQz+fx//1fcRn4H31mz61uTQ66v0oPcBD9gf6KDNG+44HbjjaWzo2hrogLOB9s0NyPU3QMfiwH7hcly1b3RU1fc6tnLsjq26jo+T0Qs=",
            answer: "m=edit&p=7VTBbtpAEL3zFdGe52CzEHZ9S9O0F0KbQhUhCyEDTrBiMLVNUxnx75mZtYG13UOlVu2hMh6e387OPM96Jvu2D9IQenhJBQ64dGmHb+3SzymvSZTHoXcFN/t8naQIAD6N4CmIs7Djl06zzqHQXvEAxUfPF10B5T2D4sE7FPdeMYVijEsCXOSGiFwBXYR3Z/jI64RuDek6iEeEHbNvingZpcs4nN8bz8+eX0xAUKJ3vJ2g2CTfQ2Fi8PMy2SwiIhZBji+TraNduZLtV8nLvvR1Z0cobozecYteedYrT3plm14j7kLu0AT6rXL17HjEun9BwXPPJ+1fz1Cd4dg7HEnXQQx6tFWiFqCaYkAlieldMrruo2WD0VXFKsZ1lDAnX1KY0eW80yovLlhnZ3I3Wd3G6lZf3eprtNRoVPKB9XTZTrA0UEi279k6bPtsh+xzx/aR7S3bHttr9hlQcbH8lzGu7d1iIIFeXQJWAAb9CqmuQRKUy0i5QK9NqAtUFlrtV0ihX69CutyBUUw81Qdd+mnQzgkNGHE3G9St/BC5jnHUEmG5PgCtDFKgjRp0A64mYxwQTsWrEpsP63TYpojj6uBPhaYiHju+q8ycgX77/6zji9F+swjTq1GSboIYP/vxOtiFAgeMyJJ4nu3Tp2CJ3cLzB5jb8g6LipNkF0db2y963iZp2LpEZLh6bvNfJOmqFv01iGOLyHiYWpT59iwqTyPrOUjT5NViNkG+toiLAWBFCre5LSAPbInBS1DLtjm/87Ejfgi+fYnTW/6f3n9retMZOL80wy/n6h+baf+WHP58k7S195FuaX9kW9u85Budjnyjpylhs62RbelsZOvNjVSzv5FstDhyP+lyilpvdFJV73VK1Wh3SnXZ8f6s8wY=",
        },
    ],
});
