import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Every distinct domino with up to the maximum number of pips must appear exactly once
    const polyominoes = puzzle.lattice.polyominoes(2);
    const placements = puzzle.points.placements(polyominoes);
    const dominoes = range(Math.max(...Array.from(puzzle.texts.values(), text => parseInt(text))) + 1).flatMap(a =>
        range(a + 1).map(b => [b, a])
    );

    // Divide the board into dominoes
    const grid = new ValueMap(puzzle.points, _ => cs.choice(dominoes));

    const placementGrid = new ValueMap(dominoes, _ => cs.int());
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                ...placements.get(p).map(([placement, _, type]) => {
                    const domino = placement.map(p => parseInt(puzzle.texts.get(p))).sort();
                    return And(...placement.map(p => arith.is(domino)), placementGrid.get(domino).eq(type));
                })
            )
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Dominosa",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVPb5tOEL37U0R73gOwQBxuaRr34rpN7SqKELLWNolRwJsu8EuF5e+e2YGU3YUecmibw0+I0fAY9r3984byR81lSkMaUDalDnXh8sKQet6UMtfH2+muVVblaXRGL+tqLyQklH6Zzeg9z8t0EndVyeTYXETNDW0+RTFxCSUe3C5JaHMTHZvPUbOgzRJeEeoCNm+LPEiv+/QW36vsqgVdB/JFl0N6B+k2k9s8Xc9b5GsUNytKFM8H/FqlpBD/paTToZ63othkCtjwCiZT7rOn7k1Z78Rj3dW6yYk2l63c5Yhc1stVaStXZSNy1Sz+sNyL5HSCZf8GgtdRrLR/79Npny6jI8RFdCSepz51QEu7N8RjNuArAPbuFxC8Ls4rENoV59YYDFm0CoYsTAOQRRuUIYv+CbLoFcji94Bvz8VHFr0CWfQKm8W3WXxk0ZQGyKINGtgsAbLoALLoY9grFthzCZFF0xHaKxYiiw7Y+xIii15h7gscARcPwh3GGUYP4wrOCW0Yxo8YHYwBxjnWXGO8xXiF0ccYYs25OmlvOot/QU7sedjY2it4W55MYrKoi00qzxZCFjwn0OJIKfJ1Wct7vgXDYgcETwJ2wEoDyoV4yrODWZc9HIRMR18pMN09jNVvhNxZoz/zPDeAtqMbUNt6DKiS0Fe0Zy6leDaQgld7A9B6kDFSeqhMARU3JfJHbrEV/ZxPE/KT4B0z+H+w//8f/+j/obbAeW/OfW9y8PQKOWp9gEfcD+ioyzt8YHTAB5ZWhENXAzpibEBtbwM0tDeAA4cD9huTq1FtnytVttUV1cDtiko3fJxMXgA=",
            answer: "m=edit&p=7VVNb9swDL3nVxQ662DrK61vXdfu0mXr0qEojKBwUrc16sSd7ayDg/z3kbIS2Yx36GEfh8Ew8fxMPVISKVXf1kmZcsM1l8c84CE8whguxDGXobJv4J7rrM7T6IifruunogTA+aeLC/6Q5FU6ip3XbLRpTqLmijcfopiFjDMBb8hmvLmKNs3HqJnwZgq/GA+Bu2ydBMBzD2/sf0RnLRkGgCcOA7wFuMjKRZ7eXbbM5yhurjnDOO/saIRsWXxPmcsDvxfFcp4hMU9qmEz1lL24P9X6vnhes12ILW9O23SnA+lKn67cpyuH0xW/P92T2XYLy/4FEr6LYsz9q4fHHk6jzRbz2jAhcGgAubR7w4SkhEJCdAi9W5wdYajHmGhIQTykjSI7hCKiUtMhhnrYKMoTis5FSeqhqAeNomgUNSaZakFENY2iFSU01aArpulcjCB5GLpiRlGC7osx1KO/L1ACoS2EW2svrBXWXkOd8EZa+97awFpt7aX1Obf2xtoza5W1xvqMsdKgFrsapj+ahSGcMiHMVEI+oQAsWxxIj0PEymEFWDsf7XGI2DhsAI9bLEBfOH0B+qKjucegKZTXEdrrCKcpQUc6HQk60o0V0mOJ2OkI5bFE7DSF9lgidvrCeCwRj30s5eIqxC6Wgliqo7/HoKmcvkLsNBVoqrHX0TtNGKuV98dCle3JsC+OduOnnUJpiwM3fjuKcVn3j34bno1iNlkv52l5NCnKZZIzuDRYVeR31bp8SBZwBNo7hVtuZT17VF4UL3m26vtlj6uiTAd/IZnePw75z4vynqi/JnneIyp7R/ao9jDvUXWZ9b6Tsixee8wyqZ96ROdU7ymlq7qfQJ30U0yeExJt6ee8HbEfzL6xhBtZ/r+R/9KNjFsQvOle/iNH87+Vjq3eohxsfaAHuh/YwS53/EGjA3/Q0hjwsKuBHWhsYGlvA3XY3kAedDhwv2hyVKV9jlnRVsdQB92OoboNH89GPwE=",
        },
    ],
});
