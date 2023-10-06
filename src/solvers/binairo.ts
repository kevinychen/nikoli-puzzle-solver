import { range } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a black or white circle in every cell
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Some circles are given
    const symbols = [...new ValueSet([...puzzle.symbols.values()])];
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(grid.get(p).eq(symbols.findIndex(s => s.eq(symbol))));
    }

    // Each row and column contains an equal number of white and black circles
    for (const [p, v] of puzzle.entrancePoints()) {
        const line = puzzle.points.sightLine(p.translate(v), v);
        cs.add(Sum(...line.map(p => grid.get(p))).eq(line.length / 2));
    }

    // There may not be a horizontal or vertical run of 3 or more consecutive shaded or unshaded cells
    for (const [p, arith] of grid) {
        for (const v of puzzle.lattice.edgeSharingDirections()) {
            cs.add(Or(...range(3).map(i => arith.neq(grid.get(p.translate(v.scale(i))) || -1))));
        }
    }

    // Each row and column is unique
    for (let i1 = 0; i1 < puzzle.width; i1++) {
        for (let i2 = i1 + 1; i2 < puzzle.width; i2++) {
            cs.add(Or(...range(puzzle.width).map(j => grid.get(new Point(i1, j)).neq(grid.get(new Point(i2, j))))));
            cs.add(Or(...range(puzzle.width).map(j => grid.get(new Point(j, i1)).neq(grid.get(new Point(j, i2))))));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved symbols
    for (const [p, arith] of grid) {
        if (!puzzle.symbols.has(p)) {
            solution.symbols.set(p, symbols[model.get(arith)]);
        }
    }
};

solverRegistry.push({
    name: "Binairo",
    keywords: ["Takuzu"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRRb9o8FH3nV0x+9gNJINC8df3KXvi6dTBVKIqQAbdEDZg5yToZ8d97702kYOy9VKrWh8ny0cnx5fo45Lj8WQsteQwjGvM+D2CEcUwzGAxo9tsxz6tCJp/4dV1tlQbC+dfJhD+KopS9tK3KekdzlZh7br4kKQsYZyHMgGXc3CdH839iFtzMYInxALRpUxQCve3oA60ju2nEoA/8ruVAF0DXuV4XcjltlG9Jauac4T6f6ddI2U79kqz1gc9rtVvlKKxEBYcpt/mhXSnrjXqu29ogO3Fz3dideexGnV2kjV1kHrt4ine2e5WdTvDav4PhZZKi9x8dHXd0lhwB7wgDwkVyZGEMbcaw2blBFkWgho468KmD0NdhiH2d2hhrHXWEfZ0OI48zMD0h6yHhHE7GTUT4H2GfcEg4pZpbwgfCG8IBYUw1I3w3b35772QnDUOKYjOGb+dZL2WzrThIBsFkpSqWZa0fxRo+M8otfEmg7evdSmpLKpQ6FPnersuf9kpL7xKKcvPkq18pvbno/iKKwhKae8iSmn/dkioNaTh7FlqrF0vZiWprCWfJsTrJfWUbqIRtUTyLi9123ZlPPfab0UwjuPWif7feX7r18C/of7T0fjQ79PUq7Y0+yJ70g+pNeas7QQfdiTRu6KYaVE+wQb3MNkhuvEF0Eg7aH0KOXS9zjq4uo45bOWnHrc4Dn2a9Vw==",
            answer: "m=edit&p=7VVLb9swDL77Vww66xBLtpz61nXNLtmjS4ciMIJASdzGqBNnfqyDA//3UrRXRzF3KVBsh0EQQX+iyY+UKBU/Kp3HXMGQYz7iLgyhFE7X83COunGblGkcvuOXVbnNclA4/zKZ8HudFrETdVYL51hfhPUNrz+GEXMZZwKmyxa8vgmP9aewnvN6BkuMu4BNWyMB6nWv3uG60a5a0B2B/rnTQZ2Duk7ydRovpy3yNYzqW85MnPf4t1HZLvsZs46H+V5nu1VigJUuIZlimxy6laLaZI8V+x2i4fVlS3dG0JU9XflCV9J0xdvTvVg0DZT9GxBehpHh/r1Xx706C4+N4WWki3IeHplQ4GbMbYJMSkDFAPUo1BOUB19RtkpQaOBRHgKCGZCeIHWB8hYy47VE+QHlCKWPcoo21yjvUF6h9FAqtAlMbaB6pz7U4O/TorURZn0ByZSEpFISZKLCJz0E5BaQxZY+iZJbIAPK1iM33KM3nIzmkQfJI7PwyZr5ZM18smY+WTOfzE2RfhWZmyJzU/RhJqMF5A4FZH0DMouAqNnLYTcHuXEiIfCybof/en3hRGy21YeYwdXNiixdFlV+r9dwEeHNzhHbV7tVnFtQmmWHNNnbdsnDPstjcsmA8eaBsl9l+ebM+5NOUwso8KWyoLY8FlTmifWt8zx7spCdLrcWcHK3Wp7ifWkTKLVNUT/qs2i7PufGYb8YzkjCuyj/v4t/6V00WzB69ev4Zs/Nv0UHT2+Wk60PMNH9gJJd3uGDRgd80NIm4LCrASUaG9Dz3gZo2N4ADjocsD80ufF63ueG1Xmrm1CDbjehThs+WjjP",
        },
    ],
});
