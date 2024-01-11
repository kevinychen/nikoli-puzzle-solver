import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number between 1 and 9 into every unshaded cell
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 9));
    for (const [p, arith] of grid) {
        cs.add(arith.eq(0).eq(puzzle.shaded.has(p)));
    }

    // Each gray line should contain a sequence of numbers which increases by 1
    for (const [p] of grid) {
        const lineNeighbors = [...puzzle.points].filter(q => puzzle.lines.has([p, q]));
        for (const q of lineNeighbors) {
            cs.add(Or(grid.get(q).eq(grid.get(p).add(1)), grid.get(p).eq(grid.get(q).add(1))));
        }
        if (lineNeighbors.length === 2) {
            const [q, r] = lineNeighbors;
            cs.add(grid.get(q).neq(grid.get(r)));
        }
    }

    // Numbers on shaded cells indicate the sum of numbers in the (up to four) orthogonally adjacent cells
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...puzzle.points.edgeSharingPoints(p).map(q => grid.get(q))).eq(parseInt(text)));
    }

    // Identical numbers cannot be adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0), grid.get(p).neq(grid.get(q))));
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value) {
            solution.texts.set(p, value.toString());
        }
    }
};

solverRegistry.push({
    name: "Number Rope",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRfb9o+FH3nU1R+9kP+FuK3rit7YfzWwVRVUYQCpCVqgjsnWacgvnuPr4MgJJUqTT+tD5PJ9cnxxffY8XHxs4pVwj00d8QtbusWoMcT2PpnNW2ellkiLvhVVW6kAuD8v/GYP8RZkQzCJisa7OpA1Le8/iJCZjPOHDw2i3h9K3b1V1HPeD3DEOM2uIlJ8gFvDHQA72hco2tD2hbw1GAP8B5wlapVliwmZqJvIqznnOk6n+jfGrJc/kpYo0O/r2S+TDWxjEssptikz81IUa3lU9Xk2tGe11dvy3WPcjU0cjXqkatX8T/LDaL9Htv+HYIXItTafxzh6AhnYsccmwkbHyWgzvWo8xx0SJg2CaH+aJ75bJSKMtaR0f8C4x0Y/NMWO8R7imOKDsU5KvPapfiZokXRpzhBPTvgjsWEj5lGOHQH5FwScobcGRk04q7h3EvuDg0acs83yOeeS8hzuQd9PorfkIQ7itcUPYqXVHyoN+Wd22b25k/W+U45od4Ean5/Hw1CNqvUQ7xKcBQm6Ta5mEqVxxneplW+TNThHU5khcwWRZMtyKg4OuC2lNmiMimfM0zXItPHrVRJ75Amk/VjX/5SqvXZ7C9xlrUIc+20KOOQFlUqHP+T91gp+dJi8rjctIgTq7RmSrZlW0AZtyXGT/FZtfy45v2A/Wb0hC6uOfffNfeXrjn9CayP5tqPJodOr1S91gfd436wvS5v+I7RwXcsrQt2XQ22x9hgz70NqmtvkB2Hg3vD5HrWc59rVedW16U6btelTg0fRoNX",
            answer: "m=edit&p=7VRNb5tAEL37V0R73gPLLubjlqZ1L67b1K6iCiEL2yRGwSYF3FRY/PfMzGLzYSJFqqr2UAHD47HsvN3hTf7jEGYRV3BIhxtc4OEadLkCT6M+FnGRRN4Vvz4U2zQDwPnnyYTfh0kejfx6VDA6lq5X3vLyo+czwTgz4RIs4OWtdyw/eeWcl3N4xbgAbqoHWQA/aGgCvKP3iG40KQzAM40VwO8A13G2TqLlVE/0xfPLBWeY5x19jZDt0p8Rq3Xg8zrdrWIkVmEBi8m38VP9Jj9s0sdDPVYEFS+vX5crG7nyLFcOyzX/vFw3qCrY9q8geOn5qP1bA50Gzr0jMwXzBBTFpZtUdFMm3CqUrAf4WDSly0ZDIY3RMPgVMOrEwJfCO1a4TowTiibFBWTmpaT4nqJB0aI4hXzC5abBPAtmcuCnOyFzTMi0uelo5HCpOTnm0tbI5srSyOJKElKSK9BnVVgilHBH8Yaiojim5DZuCmxbW9z4JOv8NW6JcHC9sFyz3gBBWyIbAldAm3YmxkhYLcJGwm4RNOm4IaSFhNsi+nNIu6cDl+wzp0WoXhZldZSeK6WrMG9VTVcKN6sa+VgKOqzhezDy2fyQ3YfrCH7IabyPrmZptgsTeJoddqsoOz1DP2B5mizzerRH7YITt6eRHSpJ06cEpuuQ8cM+zaLBV0hGm4eh8as02/Rmfw6TpEPk1Pw6lPZphyqyuPMcZln63GF2YbHtEC3DdmaK9kVXQBF2JYaPYS/brllzNWK/GF2+hGYr/zfbv9RssQTGG1uubiK/0yPf3Mr+LTn096bZoPWBHnA/sIMur/kLowN/YWlMeOlqYAeMDWzf20Bd2hvIC4cD94rJcda+z1FV3+qY6sLtmKpteD8YvQA=",
        },
    ],
});
