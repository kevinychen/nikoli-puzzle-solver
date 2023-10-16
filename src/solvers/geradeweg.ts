import { Bearing, Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({ And, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid, root] = cs.SingleLoopGrid(puzzle.points);

    // Optimization: start the loop at a specific circle
    cs.add(root.is([...puzzle.texts.keys(), ...puzzle.points][0]));

    // The loop goes through every circle
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).neq(0));
    }

    // Every straight line segment that touches a clue must have a length equal to the clue’s value
    const bearings = puzzle.lattice.bearings();
    for (const [p, text] of puzzle.texts) {
        const number = parseInt(text);
        const segmentLens: [Bearing, Bearing, number, number][] = [];
        for (const [bearing1, bearing2] of bearings.flatMap((b1, i) => bearings.slice(i + 1).map(b2 => [b1, b2]))) {
            if (bearing2.eq(bearing1.negate())) {
                for (let i = 1; i < number; i++) {
                    segmentLens.push([bearing1, bearing2, i, number - i]);
                }
            } else {
                segmentLens.push([bearing1, bearing2, number, number]);
            }
        }

        const choices = [];
        for (const [bearing1, bearing2, len1, len2] of segmentLens) {
            const [line1, line2] = [puzzle.points.lineFrom(p, bearing1), puzzle.points.lineFrom(p, bearing2)];
            if (len1 < line1.length && len2 < line2.length) {
                const [v, w] = [bearing1.from(p), bearing2.from(p)];
                choices.push(
                    And(
                        grid.get(p).is([v, w]),
                        ...line1.slice(1, len1).map(p => grid.get(p).is([v, v.negate()])),
                        Not(grid.get(line1[len1]).is([v, v.negate()])),
                        ...line2.slice(1, len2).map(p => grid.get(p).is([w, w.negate()])),
                        Not(grid.get(line2[len2]).is([w, w.negate()]))
                    )
                );
            }
        }
        cs.add(Or(...choices));
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
    name: "Geradeweg",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTBb5swFMbv+Ssqn33AkKSEW9c1u2RsXTJVFUKRk9AGFeLOwDo5yv/e5wcd2LDDDmt7mCyeHj8/258Nn4sfFZcJ9aF5PnUog+aNXXxcZ4aP07RVWmZJcEYvqnIvJCSUfpnP6R3PimQUNVXx6Khmgbqm6lMQEUYoceFhJKbqOjiqz4EKqVpCF6EM2KIuciG9atMb7NfZZQ2ZA3nY5JDeQrpN5TZL1ouafA0itaJEr/MBR+uU5OJnQhod+n0r8k2qwYaXsJlinz42PUW1Ew9VU8viE1UXtdzlgFyvlavTWq7OBuTqXfxjubP4dIJj/waC10GktX9vU79Nl8ERYhgciTvTQz3QUn8b4rkvW38BWNEBk7EG8DF/g4kFpljRGTL1rVXOcUgX2Dp8HNKZ1Ld1MMcWwhizZmHMrIFdM9z7LcY5RhfjCo6GKg/jR4wOxgnGBdZcYbzBeIlxjHGKNef6cP/q+F9BTuRO0cttm7zuezyKSFjlm0SehULmPCNwM5BCZOuiknd8C/85XhzwKwM7YKWBMiEes/Rg1qX3ByGTwS4Nk939UP1GyJ01+xPPMgPUF6GBascaqJRgx847l1I8GSTn5d4AHesaMyWH0hRQclMif+DWanm759OI/CL4RB5cu97/a/eNrl39CZz35v73Jgf/XiEHrQ94wP1AB13e8J7RgfcsrRfsuxrogLGB2t4G1Lc3wJ7Dgf3B5HpW2+dalW11vVTP7XqpruGjePQM",
            answer: "m=edit&p=7ZVNb9swDIbv+RWFzjxYX7bsW9e1u3TZunQoCiMonNRtgzpx5yTr4CD/fZQoJ7HjHXZYt8NgmHj8ipQoWZSW39ZZlYPBRxoIgOMjlXCvCGL3Bv65nq2KPDmB0/XqqawQAD5dXMBDVizzQeq9xoNNHSf1FdQfkpRxBkzgy9kY6qtkU39M6iHUI2xiwFG7JCeBeL7HG9du6YxEHiAPPSPeIk5n1bTI7y5J+Zyk9TUwO847F22RzcvvOfN52O9pOZ/MrDDJVjiZ5dPsxbcs1/fl85o1Q2yhPqV0Rz3pyn26cpeu7E9X/Pl04/F2i8v+BRO+S1Kb+9c9mj2Oks3W5rVhIrahEnOhf8OkaKbeCHFH0MoK4kDQHSFUnZDQdEaJdFfo5mFMp1PTzYMH3UQ4551eOG/74Ky5m/utsxfOCmevcWmgls6+dzZwVjt76XzOnb1x9sxZ5WzofCK7uLj8h32ETTQTEQickwRLdlEtGRCeYpCBIxmAEkRYgTtSkkiAUkSm6QVJU6ziTSySpgglwf4gSwqUJw06cqQD0JwIIyhWCwhpDI2xnlTTi44gpHFD2fghRdQahhBGDUU03xAjPJkmNtJgyC9Cvx0Z8osiMN7PQOQpBkOzNAEYytlwiGmWJoKY/IzBqvOOMcREMR5oAc0uFk0MkttDFk0TjsQ5BWE36MA944HIpWcM5MqzQg6JOfpz78+tv/As9rHc+mvP2sfuttbQWdqitP1GB9uVtqjdfttBKkJ3Ru8f/bbf40HKhuv5JK9OhmU1zwqGJz5blsXdcl09ZFM8v9yFAE5bOM+WVJTlSzFbtP1mj4uyynubrJjfP/b5T8rqvtP7a1YULWHpLriWRCdxS1pVs9Z3VlXla0uZZ6unlnBwJLd6yherdgKrrJ1i9px1Rpvv57wdsB/MvanE61T+v07/0nVqf0HwW5fqm1wy/1Y6bveWVW/po9xT/aj2VrnXjwod9aOStgMeVzWqPYWNare2UToubxSPKhy1XxS57bVb5zarbqnboY6q3Q51WPDpePAT",
        },
    ],
});
