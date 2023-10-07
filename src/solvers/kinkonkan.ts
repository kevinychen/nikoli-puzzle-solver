import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap, Vector } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a mirror in some of the cells by drawing a diagonal line connecting two opposite corners
    const grid = new ValueMap(puzzle.points, _ => cs.int(-1, 1));

    // Every outlined region contains exactly one mirror
    for (const region of puzzle.regions()) {
        cs.add(Sum(...region.map(p => grid.get(p).neq(-1))).eq(1));
    }

    // Symbols outside the grid indicate a light source
    // The light travels as a beam into the grid and is reflected by the mirrors
    let lasers = new ValueMap(puzzle.entrancePoints(), _ => cs.enum([]));
    for (const [p] of grid) {
        for (const v of puzzle.lattice.edgeSharingDirections()) {
            lasers.set([p, v], cs.enum([]));
        }
    }
    const labels = [...new Set(puzzle.texts.values())];
    for (let i = 0; i < grid.size(); i++) {
        const newLasers = new ValueMap(lasers.keys(), _ => cs.enum(labels));
        for (const [p, v] of puzzle.entrancePoints()) {
            cs.add(newLasers.get([p, v]).is(puzzle.texts.get(p)));
        }
        for (const [p, arith] of grid) {
            for (const v of puzzle.lattice.edgeSharingDirections()) {
                // laserGrid.get(p, v) is the source of the laser (if any) coming into p from direction v
                // For each possibility (empty, or diagonal mirror), find the next place the laser goes
                let w;
                cs.add(Implies(arith.eq(-1), newLasers.get([p, v]).eq(lasers.get([p.translate(v.negate()), v]))));
                w = new Vector(v.dx, v.dy);
                cs.add(Implies(arith.eq(0), newLasers.get([p, v]).eq(lasers.get([p.translate(w.negate()), w]))));
                w = new Vector(-v.dx, -v.dy);
                cs.add(Implies(arith.eq(1), newLasers.get([p, v]).eq(lasers.get([p.translate(w.negate()), w]))));
            }
        }
        lasers = newLasers;
    }

    // Every mirror must be used at least once
    for (const [p, arith] of grid) {
        cs.add(
            Implies(arith.neq(-1), Or(...puzzle.lattice.edgeSharingDirections().map(v => lasers.get([p, v]).neq(-1))))
        );
    }

    // A light beam that starts from a letter must finish at another instance of the same letter
    for (const [p, v] of puzzle.entrancePoints()) {
        cs.add(lasers.get([p.translate(v), v.negate()]).is(puzzle.texts.get(p)));
    }

    // Numbers indicate how many times the light beam is reflected by a mirror
    for (const label of labels) {
        const number = parseInt(label.match(/\d+/)[0]);
        cs.add(
            Sum(
                ...Array.from(grid, ([p, arith]) =>
                    And(
                        arith.neq(-1),
                        Or(...puzzle.lattice.edgeSharingDirections().map(v => lasers.get([p, v]).is(label)))
                    )
                )
            ).eq(number)
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved mirrors
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value === 0) {
            solution.symbols.set(p, Symbol.NW_TO_SE);
        } else if (value === 1) {
            solution.symbols.set(p, Symbol.NE_TO_SW);
        }
    }
};

solverRegistry.push({
    name: "Kin-Kon-Kan",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRLT9w8FN3Pr0Bee5H3QHYDDN3wTcsHFUJRhDJDgIhkTJ2kVBnNf+fcm9A8q6qqqrKoLN+cHF/bx4/j/EsZ6Vh6KPahNKSJYnkeV9NxuBpNuUqKNPYP5KIsHpUGkPLj2Zm8j9I8ngXUEyWc7aojv7qQ1Qc/EKaQwkI1RSirC39X/edXS1ldokkgV1bndZIFuGzhNbcTOqlJ0wBeETbqfjfAm0Rv0vj2vGY++UF1JQVNdMzdCYpMfY1FI4T+NypbJ0SsowKryR+T56YlL+/UU9nkmuFeVota7+WEXrvVS7DWS2ikt17GH5Z7FO732Pf/IfjWD0j75xYetvDS3yGu/J2wbOp6jLMxcToGjWg5RC1I/XfKI+q0S9kWUSfdjs581NEbZ3mc1Rtr7g5EQJzJEm84nnG0OF5hBbKyOZ5yNDi6HM85Z4mFmRYurY2lWBjS5gtcY7rM7htvIQc7wNhu813wbsO74N/yXfT1OuM4EM7YBcYeWZj8miWccHQ4eixtTlv/S4fz+7vwUzkBrZrLfPobzgKxvHuID1ZKZ1GKS7cqs3Ws3/5hc5Gr9DYv9X20wZ3lVwDXEtyWM3tUqtRzmmz7ecnDVul4sonIGNNP5K+VvhuM/hKlaY+oX7UeVbuvRxUa1ur8R1qrlx6TRcVjj+jYsDdSvC36AoqoLzF6igazZe2a9zPxTXANbLyz9r839G+9oXQGxnsz63uTw9dX6Unvg56wP9hJmzf8yOngR56mCce2BjvhbLBDc4Ma+xvkyOLgfuByGnVodFI19DpNNbI7TdV1fBDOXgE=",
            answer: "m=edit&p=7VTfb5swEH7PX1H52Q+AgbS8JWmylyxbl05ThVBEEtqgQtzxY62I+N93d5CAgUmbpml7mCwfx+ez/Z19n9OvuZ8E3IYmrrnGdWiGbVPXTZO6Vrf7MIsC54pP8uwgE3A4/7BY8Ec/SoORq9Nc3RudihunuOPFO8dlOuPMgK4zjxd3zql47xRzXqxhiEEsL5ZVkAHuvHG/0Dh6swrUNfBX6GvVvAfwd2Gyi4LNskI+Om5xzxluNKXp6LJYfgtYTQT/dzLehghs/QyySQ/hSz2S5nv5nNexulfyYlLxXQ/wFQ1fceErhvhWafxhujdeWcK5fwLCG8dF7p8b97px186pRF4nZgicOoW70TkeKqxomAhN9DZkI3TbhoSB0Kw90Rz3Jtr9KHvcW2tsdUgAOZ0oPpBdkDXI3kMGvBBkb8lqZC2yS4qZQ2K6AUUrIBUDlhRUwJWPxWydcQNiRO2LJt4C3KpxSzTxFsy1W+uYVu1b4MMZGSXWAFKYkTXJ2kRtjEcPl9Ombqukqzu5JF8ltj4fBEOmrsWZfNtMqXiYsLoIZqkiNs6yFcRWYy6nitTLkYsnQW08/PVGLpvvn4KrlUxiP4JCXOXxNkjO/yB9lspok+bJo7+DOqaXgRN2pEgFiqR8icKjGhc+HWUSDA4hGMD2A/Fbmew7q7/6UaQAKb10ClQpUoGyJFT+/SSRrwoS+9lBAVrSVFYKjplKIPNViv6z39ktbnIuR+yNUXcFvL3i/7v6t95VvAPtl17X33/GfuI9+bfoUPnKZFD7AA/IH9BBmdd4T+mA9zSNG/ZlDeiAsgHtihugvr4B7EkcsB+oHFftCh1ZdbWOW/Xkjlu1Fe96o+8=",
        },
    ],
});
