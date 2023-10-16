import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({}: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    const regions = puzzle.regions();
    const isStraights = new Map(regions.map(region => [region, cs.int(0, 1)]));
    for (const [p, symbol] of puzzle.symbols) {
        if (symbol.isBlack()) {
            // The loop cannot go through a shaded circle
            cs.add(grid.get(p).eq(0));
        } else {
            // The loop goes through all unshaded circles
            // Within a region, all unshaded circles contain either a corner or a straight line
            cs.add(grid.get(p).neq(0));
            cs.add(
                grid
                    .get(p)
                    .isStraight()
                    .eq(isStraights.get(regions.get(p)).eq(1))
            );
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Dotchi Loop",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VXRbtowFH3nKyo/+wHbIbR56zq6l65bR6eqiqLK0LSgBtyZsE5B/HuPb7yREE+TkKb1YYp8OTm53Huuk5Osvq21zXmMQx3zPhc4ZBzTElFEq++P63lZ5MkRP12XM2MBOP90fs4fdLHKe6nPynqb6iSprnj1IUmZYJxJLMEyXl0lm+pjUo14NcYlxgW4izpJAo528IauO3RWk6IPfOkx4C3gdG6nRX53UTOfk7S65sz1eUf/dpAtzPeceR3ufGoWk7kjJrrEMKvZ/NlfWa3vzdPa54psy6vTWu44IFft5DpYy3UoINdN8ZflnmTbLbb9CwTfJanT/nUHj3dwnGwQLykKirfJhkmFMgLNmgKZHATZYYhVroLssHGIjYLdomC3yFXoskENgyjIBuvGQWVxsO4wqHcY7DYMdMMmn9NWS4rXuBO8UhTfU+xTHFC8oJwRbooQ8J5EF8jELxfKY6UaWAJDH2E4V0mPybc1Jg9DF+EBMGanHOfvBlaYnnKAB54fIL+JY18nBnaz/qzv9p5ygGOPY2C3SxID3dBYZxQjijGNO3SP5cEP7mE7+0c5qcSu/jow6aE466VsdP+YH10au9AFjDue6eec4Q3JVqa4W63tg57C7/QChaXBLdeLSW5bVGHMczFftvPmj0tj8+AlR+ZoG8ifGHu/V/1FF0WLqD8ILap+nFtUafFaapxra81Li1noctYiGq+wVqV8WbYFlLotUT/pvW6L3czbHvvBaKUKnx/1//Pzjz4/7hb035qX35ocenqNDVofdMD9YIMu93zH6OA7lnYNu64GGzA22H1vg+raG2TH4eB+Y3JXdd/nTtW+1V2rjttdq6bh06z3Cg==",
            answer: "m=edit&p=7VXLTttAFN3nK9Cs7yKeJ3hHaeiG0tJQVciKkBMMsXBiajulcuR/587DJBNPpQqpaheV5cnJmfua6zkz9fdNWmUg8WHHMIYIHyqleSPOzTt2z3XeFFl8BKebZllWCAA+nZ/DfVrU2ShxVrPRtj2J2ytoP8QJiQgQim9EZtBexdv2Y9xOoJ3iFIEIuQtrRBFOdvCbmdfozJLRGPGlwwhvEC7yalFktxeW+Rwn7TUQneed8daQrMofGXF16P+LcjXPNTFPG1xMvcyf3Ey9uSsfN6RP0UF7asudBsplu3LZa7ksXC798+WezLoO2/4FC76NE1371x083sFpvO10XXqMzHgTbwllGCYCv0BCRZBVIZbpCHTAyhDLg9l4MBuXQTZYg+BBNhhXBiuTwbgqWK8KZlOBbNjkc9NqasZr/BLQMjO+N+PYjMKMF8Zmgh8lilB7FLNgmfgLEXOYsT1METOHUbmMOmx0a7HRsHBYIJbORvqYKWeDWDheCB9LF0ciVmIXX7hcArF0WCLWXaKd1ode1pkZuRmlWa7S2xI37n47ZN8IQinorclAI700jRjopmjEgTkk8LTqERMW4QmmLFLALMJucRsF+8OtLxPArQdTwK0dRzublzMQDnEQ1gN7yG027JRwSIGwvoL2HoikzYZdETYH9tB5CAXSekgKytpJBpL3SNko2EXlOAXKeijazyqctZGVAGUjK2nt7D46kLvda9Ne+q/7UX+gbpRgn6PXR7wdz0YJmdw9ZEeXZbVKCzyypsv0KSN4N5C6LG7rTXWfLvCkM1cHGG69Wc2zyqOKsnwq8rVvlz+syyoLTmkyw7QB+3lZ3R1Ef06LwiNqcxV6lBWyRzVV7v1Pq6p89phV2iw9Yu/w9iJl68YvoEn9EtPH9CDbarfmbkR+EvMmDC9e9v/i/UsXr/4E4zdfv2+7H37jUP23yjG7t6yC0kc6oH5kgyp3/EDoyA8krRMOVY1sQNjIHmobqaG8kRwoHLlfiFxHPdS5rupQ6jrVQO061b7gk9noBQ==",
        },
    ],
});
