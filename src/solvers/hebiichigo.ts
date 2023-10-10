import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place numbers into some of the cells to form snakes
    // Each snake consists of a sequence of the numbers from 1 to 5 which are orthogonally adjacent
    const count = 5;
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, count));
    const instanceGrid = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.eq(1), instanceGrid.get(p).is(p)));
        for (let i = 1; i <= count; i++) {
            if (i + 1 <= count) {
                cs.add(
                    Implies(
                        arith.eq(i),
                        Sum(...puzzle.points.edgeSharingPoints(p).map(p => grid.get(p).eq(i + 1))).eq(1)
                    )
                );
            }
            if (i - 1 >= 1) {
                cs.add(
                    Implies(
                        arith.eq(i),
                        Sum(...puzzle.points.edgeSharingPoints(p).map(p => grid.get(p).eq(i - 1))).eq(1)
                    )
                );
            }
        }
    }

    // Snakes must be in empty cells
    for (const [p] of puzzle.shaded) {
        cs.add(grid.get(p).eq(0));
    }

    // Two snakes cannot share a border
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Implies(And(grid.get(p).neq(0), grid.get(q).neq(0)), instanceGrid.get(p).eq(instanceGrid.get(q))));
    }

    // The number 1 denotes the snake's head
    // Snakes are facing in the direction away from its second number
    // Snakes cannot look directly at other snakes, unless separated by a black cell
    for (const [p, arith] of grid) {
        for (const [q, v] of puzzle.points.edgeSharingNeighbors(p)) {
            cs.add(
                Implies(
                    And(arith.eq(2), grid.get(q).eq(1)),
                    And(
                        ...puzzle.points
                            .sightLine(q.translate(v), v, p => !puzzle.shaded.has(p))
                            .map(p => grid.get(p).eq(0))
                    )
                )
            );
        }
    }

    // Numbers on black cells indicate the first number seen in the given direction, or 0 if there
    // are no numbers in that direction
    // Arrows don't point past other black cells
    for (const [p, text] of puzzle.texts) {
        const number = parseInt(text);
        const [v] = puzzle.symbols.get(p).getArrows();
        const line = puzzle.points.sightLine(p.translate(v), v, p => !puzzle.shaded.has(p));
        if (number === 0) {
            cs.add(...line.map(p => grid.get(p).eq(0)));
        } else {
            cs.add(
                Or(...line.map((q, i) => And(...line.slice(0, i).map(p => grid.get(p).eq(0)), grid.get(q).eq(number))))
            );
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved snakes
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value) {
            solution.texts.set(p, value.toString());
        }
    }
};

solverRegistry.push({
    name: "Hebi-Ichigo",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVNb5tAEL37V0R7aqU9sOBPbkka95K6TZ0qihCy1s4mtoK96RqaCsv/PTOzOLA2VFaVqodWmJnhzbDzWIbn9fdMGsV7cAR97nEBR+C16ex6+Nsd14s0UeEJP83SuTYQcP55OOT3MlmrVlRUxa1NPgjzK55/DCMmGGc+nILFPL8KN/mnMB/zfAwpxgVgl7bIh/CiDG8oj9G5BYUH8cjGbQhvIZTG6OfJvc6MuntQkzN7w5cwyq85w35ntAqGbKl/KFbwweuZXk4XCExlCg+1ni+eisw6u9OPWVEr4i3PT5tpByVtDC1tjGpoIzmkPVuYWaIml3ahN6U7iLdb2P6vQHgSRsj9Wxn2y3AcbpjfZaHgLLCuLazrket41vnWDch1bUm3T65nS3qBdbak3yY3QAdtRkWbiHnw1uwQUCcHwGYRDskrAItFrFMC2NIBsLkdhQLAxpUK6C3CDdjbHQOYTvE6xzilvH58LL3dLNPX8Ktq4n58NT4YVVe4NFbTU1fWprsaq2lLjn5K2q8jmcA2DmkzfbLXMEI8D8h+IOuR7ZC9pJoLsjdkz8m2yXappodDeOSY2imqvs8/RCfy26R8u6Pz9ldxK2LjzNzLmYKPd5Qtp8qcjLRZygSux3P5pBioJ1vrZLIu6kISV/jMAVvRHQ6UaP2ULFZu3eJhpY2qTSGIb7amfqrN3d7qzzJJHMD+VTiQVTMHSg1IVeWahspBljKdO0BF1pyV1Cp1CaTSpSgf5V63ZfnM2xb7yeiMAhjw4P9f01/+a8JXIX77yyclZ+ZhKt/5nQ7fneI99EPZbkihRjelQJAbUqi+DSmU2oYU6mpt6t8QUatd2tTKF8A1CgZorVIV+IFYAX4gS9jwUJkArREnQPf1CaBDiQLwQKUAaxAqXHVfq5DVvlxhqwPFwlZV0Yri1gs=",
            answer: "m=edit&p=7VVNb5tAEL37V0R7aqU9sHzDLUmTXtK0qVNFFbIs7JDYCjYphqbC8n/vzCw27AKVWzXqpQJ2hrePmdndYWbzrYzzhHtwWT43uIDLMmx6XAPv/XW7LNIkPOGnZbHIclA4/3h5yR/idJOMopo1GW2rIKxuePU+jJhgnJnwCDbh1U24rT6E1ZhXY5hiXAB2JUkmqBeNekfzqJ1LUBigX0vdBvUrqHGeZy/Th6zMk/vHZHomP/gURtUtZ+jvjKygylbZ94TV8eD7PFvNlgjM4gIWtVksn+uZTXmfPZU1V0x2vDodDttqwrYOYVv9YZt12PNlPk+T6ZU09FfDDSa7HWz/Zwh4GkYY+5dG9Rt1HG6Z6bJQcGZJYQspPBKOIYUpRUDClRTXJ+FJimdJISm+TSJAscOFSzcRM+DUZBKQJwVAZxEmyQEIEHAaAF0qgGfUC94D6LjFAN8i3O5wv+sIIszrJpPhWPrTR4YXNUzxSzbFfjw72LPFEZHQqlu26atBtmf8zippv46MBLbxkjbTpPEWUohXFo3vaDRodGi8Is4FjXc0ntNo0+gSx8MkhDRt23A7X1Py2HVqmPU5m0598AfA1wCLGFYLCDQbtqExbEpRuwUEmlFHaAzHq/NtD7iG5sU1dUagAZ7Q4vBMzYtv6IDQAvMtzWigGw1MJbDDnyEPbbz/Sw4Hi4e2G0WmTX1gfzl//20yiti4zB/ieQKl7LpczZL85DrLV3EK7+NF/Jww6CVsk6XTTc0LqdVwwtb0hQKlWfacLtcqb/m4zvKkdwpBzPMe/izL7zXrL3GaKsCGGqcCydquQEW+VN7pF1OQVVwsFKBV5BVLybpQAyhiNcT4Kda8rZo170bsB6MnsuB3t/436n/cqPEoxJHtWhbETl9j+eMsfmM6Dt8/4i2TTWxgCjvW0FQwOIW9aGDKGzaIXaZ36tVayp9t5WuFQ39glveWL4B7KhigvZWqxjvFCvBOWUKH3coEaE9xAlSvTwB1SxSAnSoF2EChQqt6rcKo9HKFrjoVC121i1Y0Gf0E",
        },
    ],
});
