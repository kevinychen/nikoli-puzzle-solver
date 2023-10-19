import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines to move all of the balls into a hole, marked by an H
    // Lines can not go through the starting point of any ball
    // Balls cannot travel over holes, but must stop exactly in a hole
    // A hole can not be used by more than one ball
    const [network, grid, order] = cs.PathsGrid(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(arith.isTerminal().eq(puzzle.texts.has(p)));
        cs.add(
            order
                .get(p)
                .eq(0)
                .eq(puzzle.texts.get(p) === "H")
        );
    }

    // A ball’s first move must be in a straight line of the number of cells indicated by the
    // number inside it, and each successive move must be one cell shorter than the previous
    const maxNumber = Math.max(...[...puzzle.texts.values()].filter(text => text !== "H").map(text => parseInt(text)));
    const distances = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p, arith] of grid) {
        if (puzzle.texts.has(p) && puzzle.texts.get(p) !== "H") {
            cs.add(distances.get(p).eq(parseInt(puzzle.texts.get(p))));
        }

        cs.add(Implies(distances.get(p).eq(0), arith.isTerminal()));
        if (puzzle.texts.get(p) !== "H") {
            for (let distance = 1; distance <= maxNumber; distance++) {
                const choices = [];
                for (const bearing of puzzle.lattice.bearings()) {
                    const line = puzzle.points.lineFrom(p, bearing);
                    const v = bearing.from(p);
                    if (distance >= line.length) {
                        continue;
                    }
                    choices.push(
                        And(
                            arith.hasDirection(v),
                            ...line
                                .slice(1, distance)
                                .map(p => And(distances.get(p).eq(-1), grid.get(p).is([v, v.negate()]))),
                            distances.get(line[distance]).eq(distance - 1)
                        )
                    );
                }
                cs.add(Implies(distances.get(p).eq(distance), Or(...choices)));
            }
        }
    }

    // Shaded cells represent water. A ball can travel over the water, but cannot land there
    for (const [p] of puzzle.shaded) {
        cs.add(grid.get(p).eq(0));
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Herugolf",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTfb9owEMff+SsqP/shP2BL/dZ1ZXtgbB1MVRVFyIBboia4c5J1CuJ/7905DJxkUl+q9WEyOS6fXO7Odr4uflbSKD6CEUbc4z6MIIjoGnr4O4x5WmZKnPGLqtxoAw7nX8djfiezQg3iJioZ7OpzUV/z+pOImc84C+DyWcLra7Grv4h6xusZPGI8AjaxQQG4V0f3hp6jd2mh74E/bXxwb8FdpWaVqcXEkm8iruecYZ0P9Da6LNe/FGv6wPuVzpcpgqUsYTLFJn1snhTVWj9UTayf7Hl90WoXqzTthsd20bXtotfTLs7ilds9T/Z7WPbv0PBCxNj7j6MbHd2Z2LEgZCKCTRnCH6ApIg/zDKExu1EsJPD5BAQtMPTbIEIAW30AI4r4A6CUL3Zgbw8FgTtLYlN0KOVpUUgzpmQB2TnMjtch2Y9kPbIjshOKuSJ7Q/aS7JDsO4p5j+vzwhW0i3Y6n1dqJw6sGHGMXuYlg5jNKnMnVwq+k2mVL5U5m2qTywzuZxv5qBgIlBU6WxRNnCD9whcFbEtvOCjT+jFLt25cer/VRvU+QqjW933xS23WrexPMsscYE8jB9mdd1BpQBUn99IY/eSQXJYbB5woyMmktqXbQCndFuWDbFXLj3PeD9hvRlccwukX/j/9/tHph1vgvTUFv7V26OvVplf6gHvUD7RX5Q3vCB14R9JYsKtqoD3CBtrWNqCuvAF2FA7sLyLHrG2dY1dtqWOpjtqx1Kng42TwDA==",
            answer: "m=edit&p=7VRNb5tAEL3zK6I9zwF2wcbc0jRuD67b1K6iClkWtkmMAiblo6mw+O+dncXGC1TKJWoPFWb8eLs783bgbf6jDLIQHLyECyZYeHHu0m2b8ne6llERh94VXJfFPs0QAHyeTuEhiPPQ8JtZK+NYTbzqDqoPns8sBozjbbEVVHfesfrkVQuoFjjEwEVupiZxhLctvKdxiW4UaZmI5w1G+B3hNsq2cbieKeaL51dLYLLOO1otIUvSnyFrdMjnbZpsIklsggI3k++j52YkL3fpU8lOJWqorjtyrVauaOWKs1wxLJe/vdzJqq6x7V9R8NrzpfZvLXRbuPCOjAvmufhSbPyrpUikTJnHRmHqRTFBxMcLgncI2+oSriR4SziWRmApyzvWshVNQeS1lqgUPZbydFhMM6VknOISdweVoPieoknRoTijObcU7yneULQpjmjOWPYHO3iZY3RajXKBT5gnsGsT9AghYYJQnOAghEICbK4QWmes0ARstcK2wDEV4iB3JdEYnBEhxwRH5XNG4Ki1Do6qtY6rRs8bmVNUHVWbXZy6e26I3Gxt+FxZWl7O69DK8NmizB6CbYhf27xMNmF2NU+zJIjxebEPnkOGNmd5Gq/zZp5HpwAQd6AVGhWn6XMcHfR50eMhzcLBIUmGu8eh+Zs023WyvwRxrBE5nWkapb4fjSqySHsOsix90ZgkKPYaceFDLVN4KHQBRaBLDJ6CTrWk3XNtsF+Mbl/gGSr+n6F/6QyVr8B85UnacaFy3tscS/+WHPp602zQ+kgPuB/ZQZc3fM/oyPcsLQv2XY3sgLGR7Xobqb69kew5HLk/mFxm7fpcqupaXZbquV2WujS8vzJ+Aw==",
        },
    ],
});
