import { Constraints, Context, Point, Puzzle, Solution, UnionFind, ValueMap, ValueSet } from "../lib";

const solve = async ({ And, Implies, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a directional loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // Pick an orientation of the loop
    const loopDirection = new ValueMap(puzzle.points, _ => cs.enum(puzzle.lattice.edgeSharingDirections()));
    for (const [p, arith] of loopDirection) {
        cs.add(Implies(arith.eq(-1), grid.get(p).eq(0)));
        for (const v of puzzle.lattice.edgeSharingDirections()) {
            cs.add(Implies(arith.is(v), grid.get(p).hasDirection(v)));
        }
    }
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Not(And(loopDirection.get(p).is(v), loopDirection.get(q).is(v.negate()))));
    }

    // Find the order of the loop
    const order = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        cs.add(Implies(loopDirection.get(p).eq(-1), order.get(p).eq(-1)));
    }
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(
            Implies(loopDirection.get(p).is(v), Or(order.get(p).eq(0), order.get(q).eq(order.get(p).sub(1))))
        );
    }

    // The loop starts at the circle
    const circle = puzzle.symbols.keys().next().value;
    for (const [p, arith] of order) {
        cs.add(arith.eq(0).eq(p.eq(circle)));
    }

    // The loop cannot go through shaded cells
    for (const [p] of puzzle.shaded) {
        cs.add(grid.get(p).eq(0));
    }

    // The loop must visit every gate in the order denoted by the numbers
    // Some gates have an unknown number
    const uf = new UnionFind<Point>();
    for (const [p, v] of puzzle.walls) {
        if (puzzle.walls.has([p.translate(v), v.negate()])) {
            uf.union(p, p.translate(v));
        }
    }
    const wallCells = [...new ValueSet([...puzzle.walls].map(([p]) => p))];
    const gates = wallCells.filter(p => uf.find(p).eq(p)).map(p => wallCells.filter(q => uf.find(q).eq(uf.find(p))));
    const gateOrders = gates.map(_ => cs.int());
    for (let i = 1; i < gateOrders.length; i++) {
        cs.add(gateOrders[i - 1].lt(gateOrders[i]));
    }
    for (const gate of gates) {
        for (const p of gate) {
            cs.add(Implies(grid.get(p).neq(0), Or(...gateOrders.map(gateOrder => order.get(p).eq(gateOrder)))));
        }
        for (const [[p], text] of puzzle.edgeTexts) {
            if (gate.some(q => q.eq(p))) {
                cs.add(Or(...gate.map(p => order.get(p).eq(gateOrders[parseInt(text) - 1]))));
            }
        }
    }

    // The loop cannot turn while traveling through a gate
    for (const gate of gates) {
        for (const p of gate) {
            cs.add(Implies(grid.get(p).neq(0), grid.get(p).isStraight()));
        }
    }

    // A gate cannot be visited more than once
    for (const gate of gates) {
        cs.add(Sum(...gate.map(p => grid.get(p).neq(0))).eq(1));
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.getDirections(model.get(arith))) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Slalom",
    keywords: ["Suraromu"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRNb9s6ELz7VwQ880CKsr5uaZr0krpNncIIBCOgHSU2IlupLDeFDP/3zC6FyrKdokDRvhweBJK7w+VyuOJw9W1ty0xG+EwkldT4jO9x81TMTTXf9bzKs+REnq6rWVHCkPLTxYW8t/kq66VN1Li3qeOkvpL1hyQVWkjhoWkxlvVVsqk/JvVQ1kNMCamBXbogD+Z5a47cfAjzzKFawR7ANm7dDczpvJzm2e2lQz4naX0tBW30jpeTKRbF90w0RMifFovJnICJrXCa1Wz+1Mys1nfF47qJ1eOtrE9f52tavmQ6vmTt020O9JfpxuPtFnX/AsK3SUrcv7Zm1JrDZCN8JRIthW94CHw3hG6IeYg9NzhPK7dCK+1GHWBEtkGyQa+RM4yQpimcFJFBQEr/nb0Iy1MRNUW9QXgfiVJk2q0Ipi44n8f9NQjL2nD/nnvFfZ/7S445535EZwpi6YdEM8TJQgWHuMIxHi42H5lm4kD6MR2VnRBO1IQZuvZUEk7gIcFPx8ChKlFYH8rgkpET+NKEVAtyIiUN140chRmuUgiCZ0zT5z5g+iH9jd/8X7t1duX7k0r9gk7qBaz+9uv/W3/cS8VwXd7baYY7PrJ5jmGwXkyy8mRQlAtL/nBmnzKBR0asivx21YQn/AZBFMCWvKID5UXxlM+X3bj5w7Ios6NTBGZ3D8fiJ0V5t5f9mZjuAu5N7UDupnegqoSwd3xblsVzB1nYatYBdh6BTqZsWXUJVLZL0T7avd0W7Zm3PfFDcEsNXnDz/wv+X73g9A/UW3sX3hodvr5FeVT7gI/IH+hRmTf4gdKBH2iaNjyUNdAjyga6L25Ah/oGeCBxYK+onLLuC51Y7WudtjqQO221q/h03HsB",
            answer: "m=edit&p=7VXJbtswEL37KwKe58BF4qJb2ia9pGlTpwgCwQhkR4mN2FYq220hw//eIYdeZDtFUaDLoRBEvnkcDh+XIWefF0VdgsVPWeAg8FOJDL/kLvw8ftej+bjMTuB0MR9WNQKA9+fn8FCMZ2Unj169zrJxWXMFzdssZ4IBk/gL1oPmKls277KmC00XmxgI5C7ISSI828IbajcIXxMrOOJLxIr63SIcjOrBuLy7IOZDljfXwPxAr0J3D9mk+lKyKMTbg2rSH3miX8xxNrPh6Dm2zBb31dMi+oreCprTl/WqrV610auOyI0T+s1yXW+1wnX/iILvstxr/7SFdgu72ZIlnGUCWKJCpROqDFUuVE5SRZbgPNaCaqGxXvn5LbEUGNPYZLNwwKzS3pLRstxbNi7qLbqnGCjHSLsrgk3nIZ4M5TUKhkaF8k0oeSjTUF4En7NQ3vg5aQeJ8TINzsxwNAQZSuLBTtYtTkPizNowaNjopvyxV+sAEgNsDIVGEt1SzAy9NnQCyuhoWA4qrJs3OLaEVTIrfyS8zCSUOsg3fjdwv3anp9cTY1KDRI0KPFKWkAEZkQXpCDlQPCCFE5aELKTEYf6mSUApB02tqYB0g7QihH4RKdApoQTSiFJINSENmhRoCYYiawWG/HQKhjRrvEpIgUnAUl+TgqVWY8BQFGPB0DyMAycCwjW0EQlwpMpqcNTDGrAR4RjU12JfGs3h3cVpcg4vMU69nUJIEp0FIcgXHREnEXuXNU427uiLPiJijChkxL6viljFOJvTuMmJ1frEdgO+3TnVeGIxXXPcXdH60j9r9zo56y7qh2JQ4p1yU4zHWF0uJv2yPrms6knh7e6weC4ZXupsVo3vZtE9C3c+BG4aerSocVU9j0fTtt/ocVrV5dEmT5b3j8f8+1V9vxf9q1e6S8zCG9ai6GZpUfN61LKLuq6+tphJMR+2iJ1LtxWpnM7bAuZFW2LxVOyNNtnOedVh31j4c4Uvpvr/Yv6tF9PvAf/Jd3Mvtymff/nF+uGz8G/JCce3qo/mPtJH0h/Zo2ke+YNMR/4gp/2Ah2mN7JHMRnY/uZE6zG8kD1IcuRey3EfdT3Svaj/X/VAH6e6H2s34vNf5Dg==",
        },
    ],
});
