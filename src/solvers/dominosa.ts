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
            answer: "m=edit&p=7VVNb9swDL3nVxQ66xCTktP61nXtLl22Lh2KwggKJ3XboE7c2c46OMh/HyUrkc14hx72cRgME8/P1CMlkVL5bZ0UqQyllngshzKgB8JQAhxLDJR9h+65XlRZGh3J03X1lBcEpPx0cSEfkqxMB7Hzmg429UlUX8n6QxSLQEgB9AZiKuuraFN/jOqxrCf0S8iAuMvGCQiee3hj/xt01pDBkPDYYYK3BOeLYp6ld5cN8zmK62spTJx3drSBYpl/T4XLw3zP8+VsYYhZUtFkyqfFi/tTru/z57XYhdjK+rRJd9KTLvp0cZ8u9qcLvz/dk+l2S8v+hRK+i2KT+1cPjz2cRJutyWsjAMzQIeXS7I0A5IQyBLQIvVucHRFyjxHTQGAeaKNgi1BMFDUfEnIPG0V5QvG5KOQeinvwKIpHUSOWqQYmqnkUrTihuQZfMc3nEgLLI+QrFipO8H0JQ+7R3RcqgcAWwq21F9aCtddUJ7JGa99bO7RWW3tpfc6tvbH2zFplbWh9RqbSqBbbGmF3tAgCOmUCmilSPkMkjA0OoIUNr5yPJqwdr1rY8KHDIeFRg4H0AbwOOE0Aj40OKK8D2uuA00TSQacDpINuLILHQDrodBA9BtJEp4nKYyB93OnrFjb8yOsrF1cZjF5HOX2FHhsd5fSVwU5TkaYaeR290yQdrby/KVRsToZ9cTQbP2kVSlMcZuO3g9gs5f7Rb8PTQSzG6+UsLY7GebFMMkGXhijz7K5cFw/JnI5Ae6dIy62sZ4fK8vwlW6y6fovHVV6kvb8Mmd4/9vnP8uKeqb8mWdYhSntHdqjmMO9QVbHofCdFkb92mGVSPXWI1qneUUpXVTeBKummmDwnLNrSz3k7ED+EfWOkGxn/38h/6UY2WzB80738R47mfysdW7150dv6RPd0P7G9Xe74g0Yn/qClTcDDria2p7GJ5b1N1GF7E3nQ4cT9osmNKu9zkxVvdRPqoNtNqHbDx9PBTw==",
        },
    ],
});
