import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // The loop cannot go through a shaded cell
    for (const [p] of puzzle.shaded) {
        cs.add(grid.get(p).eq(0));
    }

    // Pick an orientation of the loop
    const loopDirection = new ValueMap(puzzle.points, _ => cs.choice(puzzle.lattice.edgeSharingDirections()));
    for (const [p, arith] of loopDirection) {
        cs.add(Implies(arith.eq(-1), grid.get(p).eq(0)));
        for (const v of puzzle.lattice.edgeSharingDirections()) {
            cs.add(Implies(arith.is(v), grid.get(p).hasDirection(v)));
        }
    }
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Not(And(loopDirection.get(p).is(v), loopDirection.get(q).is(v.negate()))));
    }

    for (const [p, symbol] of puzzle.symbols) {
        const [v] = symbol.getArrows();
        if (symbol.isBlack()) {
            // The loop must visit all black arrows and travel in the indicated direction, without
            // turning inside the cell
            cs.add(loopDirection.get(p.translate(v.negate())).is(v));
            cs.add(loopDirection.get(p).is(v));
        } else {
            // White arrows in shaded cells represent fans, which blow wind for all cells in the
            // given direction, up to the next shaded cell
            // The loop cannot travel against the wind (if the loop goes into a lane with a fan, it
            // must move at least once in the direction of the fan)
            const line = puzzle.points.sightLine(p.translate(v), v, p => !puzzle.shaded.has(p));
            cs.add(Or(...line.map(p => grid.get(p).neq(0))));
            for (const q of line) {
                cs.add(
                    Implies(
                        And(grid.get(q).neq(0), Not(loopDirection.get(q.translate(v.negate())).is(v))),
                        loopDirection.get(q).is(v)
                    )
                );
            }
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.directionSets[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Nagareru",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRBb9owFL7zKyaffUgChNa30pVdWLcOJlRFETLglqgBMydZpyD+e997sRacpNI0qVoPk+XnL5+f7c+OP2c/CmkUD6H0L7jHfShBGFL1BwOqni3zJE+V+MCvinyrDQDOv0wm/EGmmepFNivuHctLUd7x8pOImM84C6D6LOblnTiWn0U54+UMuhj3gZtWSQHAmxouqB/RdUX6HuBbiwHeA5TG6OfleDmuqK8iKuec4UJjGo6Q7fRPxawQ/F7r3SpBYiVz2E22TQ62Jys2+qmwuX584uXV63r7tV6ElV5EHXpxG6h3nZh1qpbTN5B7GZ9OcO7fQPBSRKj9ew0vajgTRxYETPic9W0TUhMOqmZIzQj7IP1WHCH6FO/t0GjIf5/8grZCc0QwrEEPRkCParr6T2yIk/RbNCo4p+0kqKi1JMiZkKiA4hw2x8s+xY8UPYpDilPKuaG4oHhNcUAxpJwRHs8fHmD7XN5IThQEZMeqDP8ex72IzQrzINcKLs9sKw+KgU1ZptNlZnlBLoZrBdy+2K2UcahU60Oa7N285HGvjersQlJtHrvyV9psGrM/yzR1iOpVcqjKPQ6VG7DG2TfdEYfZyXzrEGc2cmZS+9wVkEtXonySjdV29Z5PPfaLUYUb7ME78P8N/EdvIP4D770Z+b3JoeurTaf3ge6wP7CdNrd8y+nAtzyNC7ZtDWyHs4Ftmhuotr+BbFkcuFdcjrM2jY6qml7HpVp2x6XOHR/FvRc=",
            answer: "m=edit&p=7VRNb5tAEL37V1R7noPZz4Rbkia9uB+pU1kRsizskBgFGxdwU2H5v3d2dv2BIVJVKWoPFWJ4vJndfSz7pvy+josENF7iDPoQ4MW1pjuQku6+v+7SKkvCd3CxruZ5gQDg880NPMZZmfQiXzXuberzsL6F+kMYsYAB43gHbAz1bbipP4b1EOohphgEyA1cEUd4fYAjylt05cigj/iTxwjvEcZFkb9MLieXjvoSRvUdMLvQJQ23kC3yHwnzQuz7LF9MU0tM4wq/ppynK58p1w/585rt1thCffG6XnHQK/Z6Rbde7vXO0mKWJZPBG8g9H2+3uO9fUfAkjKz2bwd4doDDcMM4Z2EATPiHpoeW7qHoYWxuaz9ggzGgeO+HRgr2Oz+iT6E5oqBFS4O0gZP/xJSdRLRoq+CY9pNYRa0lUc4NieIU7/DjoBYU31PsU1QUB1RzTXFE8YqipKipxtjtwQ08nkPvRjMugaMMFIdISIcUWsQhNItxyIBwSGCdGyEUSI8MSJeVHKTYIbsdFglQnpO7EYiUW00aUG6s4qDdCCV2WaX3WfSxU6Wxzs2nBRiPMOvqtAHjkMGsm8VIMG5do8C4WYx2dfsNPD4RbpOHu9Ox/xF2k7e9iHNqJu5Sf47HvYgN18VjPEvw6A/n8Sph2GRYmWeT0vMh9SAgbrleTJOiQWV5vsrSZbMufVrmRdKZsmTy8NRVP82Lh5PZX+IsaxAl9dQG5bzfoKoibbzTCW8wi7iaN4ijJtCYKVlWTQFV3JQYP8cnqy0O37ztsZ+MbvRfH7vY/w7+lzq4/Qf93+zj7fb8Zl3x35JDxzcvOr2PdIf9ke20uedbTke+5Wm7YNvWyHY4G9lTcyPV9jeSLYsj94rL7aynRreqTr1ul2rZ3S517Pho3PsF",
        },
    ],
});
