import { range } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place several 1x2 and 1x3 blocks on the board, which don't overlap each other
    const grid = new ValueMap(puzzle.points, _ => cs.int(-1, 8));

    // Each number is contained in a block
    // Blocks must contain exactly one number
    const placements: ValueMap<Point, [Point[], number, number][]> = new ValueMap(puzzle.points, _ => []);
    const trains = [...puzzle.texts.keys()];
    const trainLocation = trains.map(_ => cs.int());
    for (const [instance, p] of trains.entries()) {
        let type = 0;
        const choices = [];
        for (const [v, w] of puzzle.lattice.oppositeDirections()) {
            const line1 = puzzle.points.sightLine(p.translate(v), v);
            const line2 = puzzle.points.sightLine(p.translate(w), w);
            for (let index1 = 0; index1 <= line1.length; index1++) {
                for (let index2 = 0; index2 <= line2.length; index2++) {
                    if ([2, 3].includes(index1 + index2 + 1)) {
                        const train = [p, ...line1.slice(0, index1), ...line2.slice(0, index2)];
                        choices.push(
                            And(
                                ...Array.from(train, p => grid.get(p).eq(instance)),
                                trainLocation[instance].eq(type),
                                // A number inside a block indicates how many spaces the block can move
                                Sum(
                                    ...range(index1 + 1, line1.length + 1).map(k =>
                                        And(...line1.slice(index1, k).map(p => grid.get(p).eq(-1)))
                                    ),
                                    ...range(index2 + 1, line2.length + 1).map(k =>
                                        And(...line2.slice(index2, k).map(p => grid.get(p).eq(-1)))
                                    )
                                ).eq(parseInt(puzzle.texts.get(p)))
                            )
                        );
                        for (const q of train) {
                            placements.get(q).push([train, instance, type]);
                        }
                        type++;
                    }
                }
            }
        }
        cs.add(Or(...choices));
    }
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                arith.eq(-1),
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(...placement.map(p => grid.get(p).eq(instance)), trainLocation[instance].eq(type))
                    )
            )
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved trains
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Tren",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv+Ssqn33AkJ/cuq7ZJcvWJVNVIRQ5CW1QIe4MrJOj/O9970EFBnbYYV0Pk+Wnx8fP+Gvw19mPQuqIT6F5U+5wAc0butRdZ0bdqdo6zpPIv+CXRX5QGhLOv8zn/F4mWTQIqqpwcDIz39xw88kPmGCcudAFC7m58U/ms2+W3KxgiHEBbFEWuZBe1+ktjWN2VULhQL6sckjvIN3FepdEm0VJvvqBWXOG63yg2ZiyVP2MWKUDn3cq3cYItjKHzWSH+KkayYq9eiyqWhGeubks5a565Hq1XExLuZj1yMVd/GW5s/B8hs/+DQRv/AC1f6/TaZ2u/BPEpX9i7uR1p+W/YZ5AAL/qFQzdVsV4iGDYAKPWlAmBxpSp06oQDhGvQYQ9CfQJUnlHcU7RpbiGTXDjUfxI0aE4origmmuKtxSvKA4pjqlmgp/hjz7UG8gJ3DG5rm6jt30OBwFbFuk20hdLpVOZMPAwy1SyyQp9L3dwIsnicOiAHanSQolST0l8tOvih6PSUe8Qwmj/0Fe/VXrfevuzTBILlFeWhUpvWSjXYJzGs9RaPVsklfnBAg2TWW+KjrktIJe2RPkoW6ul9Z7PA/aLUQ88uCC9/xfkP7og8Rc47839700OnV6le60PuMf9QHtdXvGO0YF3LI0Ldl0NtMfYQNveBtS1N8COw4H9xuT41rbPUVXb6rhUx+24VNPwQTh4AQ==",
            answer: "m=edit&p=7ZVNb9swDIbv+RWFzjpYH/68dV27S5etS4eiMILCSd3WqBN3jrMODvLfR8p0ZDveYYd1OwyGiSevSYpSRGnzbZuUKQ/gUQF3uIBHaWle6YTmdei5zqo8jU746bZ6KkoAzj9dXPCHJN+kk5i85pNdHUb1Fa8/RDETjDMJr2BzXl9Fu/pjVE95PYNPjAvQLhsnCXhu8cZ8RzprROEAT4kBbwGXWbnM07vLRvkcxfU1ZzjOOxONyFbF95RRHfh7WawWGQqLpILJbJ6yF/qy2d4Xz1vWDrHn9WlT7mykXGXLVYdy1Xi58s+XG873e1j2L1DwXRRj7V8tBhZn0W6Pde2Y9NuZNv8NUwIFaQUtBx6eRkF3BHcQ4ruDkMAZeAjHKKqjiH4Q1CdMlbfGXhgrjb2GSfBaGfveWMdY19hL43Nu7I2xZ8ZqYz3j4+MywEJ1c3j9aCbcgAsfylRQjxsCi4Z9Cawa9pA16cqyh+ySDs0USGJoq0DZPAH5B6rDGriNRfZIdy37yD7pXochZ9jJGVKeUFvG/CHlCSE2bGKl40KTtzpyq3sHRn/pBKT7B4YceEA0unC4FIJYAEti8BGdWNH6B5YdYOkQw6EjKY90LGN+STklHE5SkY6sSVeWFdSgyF+BjyJ/pYFd66NJ1xCr21hk8tHaMsZqjxjWStNaaVgfl+aoYY4uzqtptcOGbjbrrLO5mw2Nm3U/iaVnzl77uG/7ez6J2XS7WqTlybQoV0nO4CRnmyK/22zLh2QJ55I56LnR1sazJ+VF8ZJn675f9rguynT0E4rp/eOY/6Io7wfZX5M87wkbc3H1pOaE7UlVmfV+J2VZvPaUVVI99YTOUdvLlK6rfgFV0i8xeU4Go63snPcT9oOZN1ZwTar/1+RfuibxL3B+67J8kyvp3yrH7N6iHG19kEe6H9TRLif9qNFBP2ppHPC4q0EdaWxQh70N0nF7g3jU4aD9oskx67DPsaphq+NQR92OQ3UbPp5PfgI=",
        },
    ],
});
