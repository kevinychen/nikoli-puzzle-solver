import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap, ValueSet, Vector } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place every ship from the fleet into the grid
    // WATER = 0, SINGLE = 1, CENTER = 2, LEFT = 3, UP = 4, RIGHT = 5, DOWN = 6
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 6));

    // Ships can be rotated or mirrored
    // All ships must be used exactly once
    // There cannot be ships in the grid that aren't present in the bank
    const lengths = [...puzzle.parameters["lengths"]].map(i => parseInt(i));
    cs.add(Sum(...Array.from(grid.values(), arith => arith.neq(0))).eq(lengths.reduce((a, b) => a + b)));
    const shipIndices = new ValueMap(puzzle.points, _ => cs.int());
    for (const [i, length] of lengths.entries()) {
        const choices = [];
        for (const [p] of grid) {
            if (length === 1) {
                choices.push(
                    And(
                        grid.get(p).eq(1),
                        shipIndices.get(p).eq(i),
                        ...puzzle.points.vertexSharingPoints(p).map(p => grid.get(p).eq(0))
                    )
                );
            } else {
                for (const [v, [startShip, endShip]] of new Map([
                    [Vector.E, [3, 5]],
                    [Vector.S, [4, 6]],
                ])) {
                    const line = puzzle.points.lineFrom(p, puzzle.lattice.bearing(p, v));
                    const points = range(length).map(i => line[i]);
                    if (points.some(p => !grid.has(p))) {
                        continue;
                    }
                    const pointsSet = new ValueSet(points);
                    choices.push(
                        And(
                            grid.get(p).eq(startShip),
                            ...points.slice(1, -1).map(p => grid.get(p).eq(2)),
                            grid.get(points[length - 1]).eq(endShip),
                            shipIndices.get(p).eq(i),
                            ...points.flatMap(p =>
                                puzzle.points
                                    .vertexSharingPoints(p)
                                    .filter(p => !pointsSet.has(p))
                                    .map(p => grid.get(p).eq(0))
                            )
                        )
                    );
                }
            }
        }
        cs.add(Or(...choices));
    }

    // Numbers outside the grid indicate how many cells in the row or column are occupied by ships
    for (const [line, p] of puzzle.points.lines()) {
        if (puzzle.texts.has(p)) {
            cs.add(Sum(...line.map(p => grid.get(p).neq(0))).eq(parseInt(puzzle.texts.get(p))));
        }
    }

    // Some ship segments are given (corner pieces, centers, or single-length boats), along with their orientation
    for (const [p, symbol] of puzzle.symbols) {
        if (!symbol.eq(Symbol.WATER)) {
            cs.add(grid.get(p).eq(symbol.style as number));
        }
    }

    // Cells marked with water cannot be used by ships
    for (const [p, symbol] of puzzle.symbols) {
        if (symbol.eq(Symbol.WATER)) {
            cs.add(grid.get(p).eq(0));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved mines
    for (const [p, arith] of grid) {
        if (!puzzle.symbols.has(p)) {
            const value = model.get(arith);
            if (value) {
                solution.symbols.set(p, new Symbol("battleship_B", value));
            } else {
                solution.symbols.set(p, Symbol.WATER);
            }
        }
    }
};

solverRegistry.push({
    name: "Battleship",
    parameters: "lengths: 111222334",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZVBb5swFMfv+RSVzz5gIBS4tV27S5etS6eqQihyUtqgQtwZWCeifPe+96ADDDvs0K2HifD0+Nn4/W3nb4rvldQJD+ByfG5xAZfjW3T7Lv6s9rpOyywJj/hJVW6VhoTzzxcX/F5mRTKLBL1rxbN9HYT1Fa8/hhETjDMbbsFiXl+F+/pTWN/yeglNjAtgl00nG9LzLr2hdszOGigsyBdtDuktpGtZgp5imz6tThv6JYzqa86w1imNgCnL1Y+EtVrweaPydYqgG6BtKao79Vi1fUV84PVJI3k5IdnpJGPaSMZsQjLOBCVvUr3JktXlG8gN4sMBlv4rCF6FEWr/1qV+ly7DPcRFuGd2gK96oKXZH+ZYCKweEAicHrARwIb+Ao4JXARuD8xf1/MVeAZwzSpzGqPXwzs2BvVJaa9HQDrmHRCWWUYImm9PqzCmA+siaHVuYXVcfP+Yj/9lLEB53lSLsFDXfLLJ8aEJ6phNUO6CitoUr2GXeO1Q/EDRojineEl9zineUDyj6FL0qM8x7vMf/RP6834jOZFr08HSXd7ffY5nEVtU+TrRRwulc5mBh5Zb+ZQwOLBYobJVUel7uQHr0XkG7gK2ozcGKFPqKUt3w37pw07pZLIJYXL3MNV/rfSdMfqzzLIBaE7nAWoOkQEqNZwQvWeptXoekFyW2wHonSaDkZJdORRQyqFE+SiNank358OM/WR0Rw58D5z/X4N/+DXAbbDe20nw3uTQP1jpSfsDnjgBgE46veUjswMf2RoLjp0NdMLcQE1/AxpbHODI5cB+Y3Qc1fQ6qjLtjqVGjsdSfdNH8ewF",
            answer: "m=edit&p=7VdLb9swDL7nVxQ66yBKfki+tV27S5etS4eiCILASd0mqBN3TrINDvLfR8lp/eSAHbrtMDgW6I+y+IkPmdl83cV5wg1eSnPBAS+lhbu1Z3/ieN0st2kSnfDT3XaR5Shw/vHykj/E6SYZjMG9KyaDfWGi4poX76MxA8aZxBvYhBfX0b74EBV3vBihinFA7KqcJFG8qMRbp7fSeQmCQHl4lFG8Q3EWb5HPZrF8np6V6KdoXNxwZm2duRWsyFbZt4QdudjnebaaLVljgaNms7vPnnbsxcyBF6cl5VEPZVVRVq+UVT9leaQ8X+bzNJlevQFdMzkc0PWfkfA0GlvuXypRV+Io2h8srz2Txr4aIJcyPkwJC4gaABZQNUBaQNYA1QY8C3g1wH/x5wsQtACvbcX3WjOCsLWoFq0ZxvHwKwBE2wyAaXGF1nbQL+C8c4fe8ez7Ie9mGTOWXtCnAWF5+b0qpVEFXRWau3RGpRtvMEq8UG5850bhRt+NV27OhRtv3XjuRs+NgZsT2jhjJtTXCDpvD91Ybre0MKq2Lqmte4rUWKeoXo1P+cQL+12CGk3aMZTGt3a8Xg0ZSj8kNSQDn2QQCFIDpIb0dWAZyF4NySAkGYRAxSeUlJ1QUZELPdKOT2k0UHY06QNN5psmGWiaAZkHmswDTeaBIe2YgMpEQ9oxmoqPMZTfQJBpBYK0BILcEghDHm1AphYATQPI0AKQsQUggwtSUL4FSdOQNA1J05C/oEEGHySZZSDJAw/ch7Tf84qmoWgaiqah6NxQ5NECHpEArx8t+0E6DMaedC1kdQV/9nkyGLPhbjVL8pNhlq/iFLul0SJ+Thi2pmyTpdPNLn+I59hkuc6VO2zt3mhAaZY9p8t1c97ycZ3lSa/Kgsn9Y9/8WZbft1b/HqdpA9i4PrwBle1iA9rmy8ZznOfZ9wayireLBlDrGxsrJettk8A2blKMn+KWtVW158OA/WDuxmML/y387/v/Yt9vwyB+q/uv97pv1oL+W3RcBmd5b/kj3HMCINpb6Ue8U+yId8raGuxWNqI9xY1ou74R6pY4gp0qR4wodLtqu9Ytq3a5W1Odirem6kU/ngx+Ag==",
        },
    ],
});
