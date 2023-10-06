import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap, ValueSet } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place an arrow in each cell outside the grid
    // Every arrow can go horizontally, vertically or diagonally
    const directions = puzzle.lattice.vertexSharingDirections();
    const points = puzzle.points.expandToBorders();
    const grid = new ValueMap(points, _ => cs.enum(directions));
    const arrowSpots = new ValueSet(
        [...puzzle.points].flatMap(p => puzzle.lattice.edgeSharingPoints(p)).filter(p => !puzzle.points.has(p))
    );
    cs.add(...Array.from(grid, ([p, arith]) => arith.neq(-1).eq(arrowSpots.has(p))));

    // Every arrow points to at least one cell with a number
    for (const p of arrowSpots) {
        cs.add(Or(...puzzle.points.vertexSharingNeighbors(p).map(([_, v]) => grid.get(p).is(v))));
    }

    // The numbers indicate the total number of arrows that point to them
    for (const [p, text] of puzzle.texts) {
        cs.add(
            Sum(
                ...directions.flatMap(v =>
                    points
                        .sightLine(p, v)
                        .filter(p => arrowSpots.has(p))
                        .map(p => grid.get(p).is(v.negate()))
                )
            ).eq(parseInt(text))
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value !== -1) {
            solution.symbols.set(p, Symbol.fromArrow("arrow_B_W", directions[model.get(arith)]));
        }
    }
};

solverRegistry.push({
    name: "Arrows",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZNT+NIEL3nV6A+96HLdvx1Y1jYC5sdFkYIWRFygoEIJ2YcZxg5yn+nuhwm1WXPYQ7LcBg5rlSeq199xM/t9ddNXhcajP34scZvPAKI6fTikE6zP64WTVmkR/p40zxWNTpa/3t2pu/zcl2MMrsSj+lo2yZpe6Hbv9NMgdLKwxPUVLcX6bb9J20nur3ESwpjdXveBXnonh7ca7puvZMOBIP+ZO+je4PufFHPy+L2vEM+p1l7pZXN84lWW1ctq2+F2tdhf8+r5WxhgVneYDPrx8Xz/sp6c1c9bfaxMN3p9rgr93KgXP9QrnW7cq03UK7t4n8uN5nudjj2/7Dg2zSztX85uPHBvUy3aCfpVgVjuxT/Gej+GxWEFvAZEL3N4g2ILRAwIBEcYyM4xiAjPAlIjpA4DAMkRyg5Ql+kDQPJQd2yXkLZbUQcLCIiDpYlkhwRcbB5RDQxljaiifEl1C1LG8uJxcTBSGPi4BHEwSIS4mCVJnJiCU2McSTU7ZgB1C2LACNJwBALSwxGDg2MnBoYeaOBkbMHQ007MfJeAyAeByEevgqIhzMD8bBGAeT4wJPzA49656s8OUHw5I0Lfo/HJx6eyyeekCPy5gWfZuisot6dmN4MA+Lh2QPi4V10oncQ4nEQmiGvsKd76ITPEaF8fMgAPWpuyJ6R9che4ZNItz7Zv8gasmOy5xRzSvaa7AnZgGxIMZF9lv3S0+4dysmCcbf9/Tii9/09HWVqslnOivpoUtXLvFS4Eat1Vd6uN/V9PsdthfZp3DkQW1GkA5VV9VwuVm7c4mFV1cXgJQsWdw9D8bOqvhPsL3lZOkD35uFA3QbpQE2Nux/7ndd19eIgy7x5dAC2UzpMxapxC2hyt8T8KRfZloeedyP1XdGZ+fgm5P95y/lNbzn2LzAfTf0frRy6e6t6UPoID6gf0UGV7/Ge0BHvSdom7Ksa0QFhIyq1jVBf3gj2FI7YT0RuWaXObVVS6jZVT+02FRd8Nh29Ag==",
            answer: "m=edit&p=7VZNU9swEL3nVzA666CVZcnODSj0QtPS0GGYTCbjBAMZnJg6SemYyX+vtE6IvRKHHkp76DjerJ9Xbz+klbX6vsmqnINwvyjh9t9eChK8ZaLxFrvrar4u8v4RP96sH8rKKpx/Pj/nd1mxynsjwLEw7r3Uab++5PXH/ogB40zaG9iY15f9l/pTvx7wemhfMWvL64vGSFr17KBe43unnTYgCKsPdrpVb6w6m1ezIp9cNMiX/qi+4sz5OcHRTmWL8kfOdnG451m5mM4dMM3WNpnVw/xp92a1uS0fN2zvYsvr4ybcYSDc6BBu9BpuFA5X/vlw0/F2a8v+1QY86Y9c7N8OanJQh/2XrYvrhanYDbUzA83cMKUdELUAs6/FHkgcoFpASjhiQThioBaSApRDI4doAZRDUw4dEbdaUY6Y5KJptiYiFkYRL4ZyGE3qYQxxaxI6JCVuE1qxxBDSJKEWKbFIBYk0pRVLJeFIMdu4BShiAYKSgJDEMQhaNBC0aiDoQgNBaw/CeDZ0rQHEHqLpKDCUGRKSKAAtH0haP5BAR0laQZB04ULk8URAfUXIo9sIXbwQKW9U7Nl4NVQR9a4UzaJp+g6iPcTQCL2+B+XVkHS+3WQAt5oblOcoJcoruxPxOkL5AaVAGaO8QJszlNcoT1EqlBptjNvL7G7X5tDe6AHKJorGw3AfEcN50ZxlVVU+T04m17glM5ycxIejMOzKa3w4DlvrMGzCcBLkxhmNPTgOBxgnwSx12KWRQesEgtaJDkaShpMHIYLkINKwPYQTBekylQHcpap8HMsLPq5kmB+/VwH72IT54zf84lctECd+3AL2+I0L2cs3cFeHKICrgP1r07mG2vZGKubQucz7Po97IzbYLKZ5dTQoq0VWMHtkZKuymKw21V02swcgPFFyxJZo2YGKsnwq5suu3fx+WVZ58JUD89v7kP20rG4J+3NWFB1ghWfkDtQc5TrQupp3nnEKOsgiWz90gNaZrsOUL9fdANZZN8TsMSPeFoectz32k+FtV4g91P8/j/+l87ibAvFbp/J3+Wz+W+Hg6i2rYOtbOND9Fg12+Q73Gt3iXks7h35XWzTQ2BalvW0hv70t6HW4xd5ocsdK+9xFRVvdufK63blqN/xo3PsF",
        },
    ],
});
