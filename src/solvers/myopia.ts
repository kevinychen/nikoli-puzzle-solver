import { Constraints, Context, Point, PointSet, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines along the edges of some cells to form a loop
    const expandedPoints = new PointSet(
        puzzle.lattice,
        [...puzzle.points].flatMap(p => puzzle.lattice.vertexSharingPoints(p))
    );
    const grid = new ValueMap(expandedPoints, _ => cs.int(0, 1));
    for (const [p, arith] of grid) {
        if (!puzzle.points.has(p)) {
            cs.add(arith.eq(0));
        }
    }

    // The loop cannot branch off or cross itself
    for (const i of [0, 1]) {
        cs.addAllConnected(expandedPoints, p => grid.get(p).eq(i));
    }

    // Arrows point towards the lines closest to the clue
    // If a clue has multiple arrows, the distance to the closest line must be the same
    // Directions without an arrow must have a line further away, or not have a line in that direction
    for (const [p, symbol] of puzzle.symbols) {
        const arrows = symbol.getArrows();
        const lines = puzzle.lattice
            .bearings()
            .map(bearing => [bearing.from(p), expandedPoints.lineFrom(p, bearing).slice(1)] as [Vector, Point[]]);
        const choices = [];
        for (let i = 0; i <= Math.min(...lines.map(([_, line]) => line.length)); i++) {
            choices.push(
                And(
                    ...lines.flatMap(([v, line]) =>
                        line.slice(0, i + 1).map((q, j) =>
                            grid
                                .get(q)
                                .neq(grid.get(p))
                                .eq(arrows.some(w => w.eq(v)) && j === i)
                        )
                    )
                )
            );
        }
        cs.add(Or(...choices));
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of expandedPoints.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Myopia",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb9owFH3nV0x+9kNC+Mxb15W9sG4dTBWKImTALVEDZk6yTkH89957nSqYmE6aVrUPk+Orm+Oj6+OP4+xnIbTkfWjBgHvchxZ4Heo9D7/nNk3yVIYf+EWRr5WGhPOvoxG/E2kmW1HFilv7chiWN7z8HEbMZ5y1ofss5uVNuC+/hOWMlxMYYtwHbGxIbUiv6vSWxjG7NKDvQX5d5ZDOIBVaq8f5UqssM+C3MCqnnOFUH6kApmyjfklWScH/pdosEgQWIof1ZOtkV41kxUo9FBXXjw+8vDCKJw7FQa0YU6MYM4diXAgqXiZ6mcr5+BXkDuPDAXb+OwiehxFq/1GngzqdhHuI1xR9irNwz9o9KAMniGcPuhtby4LuHwhdHwkweJbQNxWohovQ80yFs1P0gmcN0J2EYS3SSRjQKl4QOey8qAF2a0R71qY4hS3lZUDxE0WPYpfimDhXFG8pXlLsUOwRp4+H8tfH9kpyonbHbGHVuv/+L25FbLIWO8nguWCZSudZoe/EEm4+vSZwuQHbFpuF1BaUKrVLk63NS+63SkvnEIJyde/iL5RenVR/FGlqAeZttCDjYQvKNRj06J9ujYVsRL62gCMzW5XkNrcF5MKWKB7EyWybes2HFvvNqEcBXPLg/1v8dm8xnoL33qz93uTQBVba6X6AHQ8AoE6jV3jD64A3XI0TNo0NqMPbgJ7aG6CmwwFsmBywMz7HqqdWR1WnbsepGobHqY49H8WtJw==",
            answer: "m=edit&p=7VVdb5swFH3Pr5j87AeM+bB567p2L91Hl05VhaKIpLSJSkIHyToR5b/v2FxCSOgqTau2h4nGPRzOPfdic+3y2zopUh7ikoo7XOCSjmd/gWP+mutqvsrS6A0/Wa9meQHA+afzc36XZGU6iEk1GmwqHVWXvHofxUwwzlz8BBvx6jLaVB+i6oZXQzxiXIC7qEUu4FkLr+1zg05rUjjAHwkD3gAmRZE/jadFXpY1+TmKqyvOTKq31sBAtsi/p4xKMffTfDGZG2KSrPA+5Wz+SE/K9W3+sGZNli2vTuqKhz0Vy7ZiuatY9lfsUsXTeTHN0vHFK5SrR9stZv4LCh5Hsan9awtVC4fRZmvqMqOw4020YW4Am7hee9R9NLVM+i8IfGEEwn4//YKwdrAefYLAqR2eTRHIpgbnGQfdFtkrUP4LRWrvlzVgts7tnLl2vMKU8kra8Z0dHTv6drywmjM7Xtvx1I6eHQOrCc2iYNn2PYJuNBOez4WPBZJoI8/juK+xlMBei2WDoZGk8ULEKuLhI8lHBogNa+wraDTp97BErEexnubCLFDDyz3eJ97HtAaCNPCR5ONjNgOXeOg90nvQ+6T3UU9A9QTwD8gfu48ISRPAJySf0AWWxO9j5A0pb4hcinKFiFUUq6BXpFeYN0XzphCrKFYjr6a8ag9rxGqK1YjVTSzmXNOcK81dp86L/8Bi57nDJpfWpHHBy51/iz1g8tQ+cL12rhDcFfQuGrkE5RLwF4IwfIRs/XcYPqLxCYBD4ht8sDnUH/Sw2Sh2H735oLeD2PXqZqPL//N3o0HMhrPkMWU4WFiZZ+NyXdwlU+yR9tzhlluuF5O06FBZnj9m82VXN79f5kXa+8iQ6e19n36SF7cH7k9JlnWI0p6iHare7TvUqph37u3+0mEWyWrWIfa2/Y5Tulx1C1gl3RKTh+Qg26J95+2A/WD2F0tsh/L/qf33Tm2zCs5vn92vdib9W+XYDzgversfdM8GALa30Yk/6nXwR11tEh43Ntie3gZ72N6gjjsc5FGTg3umz43rYaubqg673aQ6aniTar/n49HgJw==",
        },
    ],
});
