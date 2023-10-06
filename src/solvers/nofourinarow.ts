import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a black or white circle in every cell
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Some circles are given
    const symbols = [...new ValueSet([...puzzle.symbols.values()])];
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(grid.get(p).eq(symbols.findIndex(s => s.eq(symbol))));
    }

    // There may not be a straight run of 4 or more consecutive shaded or unshaded cells
    for (const [p, arith] of grid) {
        for (const v of puzzle.lattice.vertexSharingDirections()) {
            cs.add(Or(...range(4).map(i => arith.neq(grid.get(p.translate(v.scale(i))) || -1))));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved symbols
    for (const [p, arith] of grid) {
        if (!puzzle.symbols.has(p)) {
            solution.symbols.set(p, symbols[model.get(arith)].toGreen());
        }
    }
};

solverRegistry.push({
    name: "No Four in a Row",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VXfa9swEH7PXzH0rIHPP3+8tV27l65b14wSjAlO4ramTtT5x1oc8r/3JBsc6TwYg44+DEeX0+eT7pOs71T/bLMq52DJnxNy/MfHhVA1O/RVs4ZnXjRlHn/gJ23zICp0OP96ccHvsrLOZ8kQlc72XRR317z7HCcMGGc2NmAp767jffcl7ha8u8FXjANil32Qje756N6q99I760Gw0L8afHQX6IqX5Wnf+xYn3ZwzmeNUjZQu24pfORs4yP5abFeFBFZZgwupH4qn4U3dbsRjO8RCeuDdSU/1ZoKqM1KVbk9VehNU5Qok1XVRrct8efkGdKP0cMAt/46El3Eiuf8Y3XB0b+I92itlQdlFvGeOhdO4fNxL5gBBbERAQwISE5KYyIxxXTPG9U3Ec8xRPmHok5iAMAw8ghDOAWEYkrWHZF2hHKUhkcyujYoIQ7DkMrRhYBHWYBGSAIQlOGRx4JCdBJfQAvoFwJVzGVE0o0c2Bjya0SObBfTrAf184Bsk8HBeqCNqKzvHE8w7R9lPylrKespeqphzZW+VPVPWVdZXMYHUwF+r5I3oJE5fbu2hAfeU1R/f6AckYmrUn2Lm7GZ/HDey/Bg56SzBOs9qUS7rtrrL1li51DWAxQmxXbtd5ZUGlUI8lcVOjyvud6LKJ19JMN/cT8WvRLUxZn/OylID+otNg/oarEFNhQX2qJ9VlXjWkG3WPGjAUTHWZsp3jU6gyXSK2WNmZNuOaz7M2AtTLXHwEsX9/X+J/vNLVG6/9d6KxHujo06uqCZlj/CE8hGdVPiAE5EjTuQsE1JFIzohakRNXSNEpY0gUTdivxG4nNXUuGRlylymIkqXqY7FnqSzVw==",
            answer: "m=edit&p=7VbLbtswELz7KwqdWYBL6n1L0qSX9JE6RRAYhiE7SmJEtlLZbgoZ/vcuaSWyOCpQFAjaQyFrvRotl8MlR9jVt01W5YKk+elY8D9fPsX2VnFob9lcl/N1kadvxNFmfV9W7Ajx6exM3GbFKh+MmqjxYFsnaX0h6vfpyCNPeIpv8saivki39Ye0vhb1kF95ghg73wcpdk9b98q+N97JHiTJ/sfGZ/ea3fLH5Hj/9Dkd1ZfCM3Mc25HG9Rbl99xrOJjnWbmYzg0wzda8kNX9/LF5s9rclA8b7zn9TtRHe6rDHqq6papfqOp+qqqhOptXsyKfnL8C3WS823HJvzDhSToy3L+2bty6w3S7M7yMJWuv062nJafxRVtLTxMgihHqIBHExBCTuDG+78b4oYsE2h0VAsMQYiJgGAWAAOcIGMaw9hjWFScukih3VAIMSUp3GElgTRJIEgFL0rA40lBJ8oEW4Q6QH2AUzhhAYSjAGQMoFuHuEW4fhQ4JPpxn9ogqay/5BItaW/vOWmltYO25jTm19sraE2t9a0MbExkNsEoOc4Qw+lAc+xmGrVD8F4qnzQFvd6FBDmr5jEQQEwOSuKMCCQi5owIFMYkbE5IbEyqI8QGBdYWhi0TazRxBfSIcFbsxsXRj4hBioIYJ1CeB+iTAJ4F1kYQCkdQYBSUiCTtNEoiThL0mCZtNhOkJ0xOmpwghnFFBiUlBtUjBwSAFe0wK2WtMrzG9xvQa06PGyMft8LESKDNCnRHKigIsIYqGXI28fJLM52Y3GOl926Sam0RgbfcKnecIIvpG/S7mZnef23Ety7eJHg9G3K95q7KYrDbVbTbjDsS2c8Jiy81imlcdqCjLx2K+7MbN75Zllfe+MmB+c9cXPy2rGyf7U1YUHWBlG9QOtO+lOtC6mnees6oqnzrIIlvfd4CDpqqTKV+uuwTWWZdi9pA5sy3aNe8G3g/P3iPNzbD+3wz/hWbYlF/+cUv8ar3Hv0XHntyy6pU9wz3KZ7RX4Q0OImcc5GwmREUz2iNqRl1dM4TSZhDUzdgvBG6yuho3rFyZm6lA6WaqQ7Hzx/Mn",
        },
    ],
});
