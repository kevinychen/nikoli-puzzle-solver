import { Constraints, Context, Point, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines along the edges of some cells to form a loop
    const points = puzzle.points.expandToBorders();
    const grid = new ValueMap(points, _ => cs.int(0, 1));
    for (const [p, arith] of grid) {
        if (!puzzle.points.has(p)) {
            cs.add(arith.eq(0));
        }
    }

    // The loop cannot branch off or cross itself
    for (const i of [0, 1]) {
        cs.addAllConnected(points, p => grid.get(p).eq(i));
    }

    // Arrows point towards the lines closest to the clue
    // If a clue has multiple arrows, the distance to the closest line must be the same
    // Directions without an arrow must have a line further away, or not have a line in that direction
    for (const [p, symbol] of puzzle.symbols) {
        const arrows = symbol.getArrows();
        const lines = puzzle.lattice
            .edgeSharingDirections()
            .map(v => [v, points.sightLine(p.translate(v), v)] as [Vector, Point[]]);
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
    for (const [p, q] of points.edges()) {
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
            answer: "m=edit&p=7VVdb5swFH3Pr5j87AeMwWDeuq7dS/fRpVNVoSgiKW2iktBBsk5E+e87NpcQErpK06rtYaLcHg7H957YXLv8tk6KlAe4ZMgdLnBJx7O3csxfc13NV1kaveEn69UsLwA4/3R+zu+SrEwHMalGg02lo+qSV++jmAnGmYtbsBGvLqNN9SGqbng1xCvGBbiLWuQCnrXw2r436LQmhQP8kTDgDWBSFPnTeFrkZVmTn6O4uuLMlHprExjIFvn3lJEV8zzNF5O5ISbJCr+nnM0f6U25vs0f1qypsuXVSe142ONYto7lzrHsd+yS4+m8mGbp+OIV7OrRdouZ/wLD4yg23r+2MGzhMNpsjS8ThY030Ya5Cmnieu3h+2hqmfRfEPjCCIT9fvoFQZ3B5ugTKKfO8GwJJRsPzjMZdGuyVxD6L5jU3i89YLbO7Zy5Nl5hSnklbXxno2Ojb+OF1ZzZeG3jqY2ejcpqArMoWLb9HKo7mgnpcWHmX6KNpAT2WuwR9nwufEUYeq/RK+CAMDSy0QTQh8QDe4S9ELyusb+HjUY2Gs2FWSzLQyN1y/vE+5hiJYgH9glLaLxGg1lWLmH4VORToZaiWth9REBjFfQB6ZULLGsc7GEFPwH5CVArpFoBxoY0NoQ+JH2IOQxpDkOMDWlsiLqa6up9jLGaxmqM1c1YzLn22zy6yaO56zi7PK5T5wG3wyan60jiW4zcwJRT+8C0dho5RZ0T/4EppxDAbptHUE6xhx3kEYqwAg5I0+CDzaH+oIfNRrH76M0HvR3Erlc3G13+n38aDWI2nCWPKcPBwso8G5fr4i6ZYo+05w633HK9mKRFh8ry/DGbL7u6+f0yL9LeV4ZMb+/79JO8uD3I/pRkWYco7SnaoerdvkOtinnn2e4vHWaRrGYdYm/b72RKl6uugVXStZg8JAfVFu1v3g7YD2bvWGI7lP9P7b93aptVcH777H61M+nfsmM/4Lzo7X7QPRsA2N5GJ/6o18EfdbUpeNzYYHt6G+xhe4M67nCQR00O7pk+N1kPW924Oux2U+qo4U2p/Z6PR4Of",
        },
    ],
});
