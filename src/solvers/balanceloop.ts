import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid, root] = cs.SingleLoopGrid(puzzle.points);

    // Optimization: start the loop at a specific circle
    cs.add(root.is([...puzzle.symbols.keys(), ...puzzle.points][0]));

    // The loop goes through every circle
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).neq(0));
    }

    for (const [p, symbol] of puzzle.symbols) {
        const choices = [];
        for (const v of puzzle.lattice.edgeSharingDirections()) {
            for (const w of puzzle.lattice.edgeSharingDirections()) {
                if (v >= w) {
                    continue;
                }
                const [line1, line2] = [puzzle.points.sightLine(p, v), puzzle.points.sightLine(p, w)];
                for (let len1 = 1; len1 < line1.length; len1++) {
                    for (let len2 = 1; len2 < line2.length; len2++) {
                        // The straight line segments coming out of a white circle must have equal length
                        if (!symbol.isBlack() && len1 !== len2) {
                            continue;
                        }

                        // The straight line segments coming out of a black circle must have different lengths
                        if (symbol.isBlack() && len1 === len2) {
                            continue;
                        }

                        // Numbers indicate the sum of the length of the line segments
                        if (puzzle.texts.has(p) && len1 + len2 !== parseInt(puzzle.texts.get(p))) {
                            continue;
                        }

                        choices.push(
                            And(
                                grid.get(p).eq(network.valueForDirections(v, w)),
                                ...line1
                                    .slice(1, len1)
                                    .map(p => grid.get(p).eq(network.valueForDirections(v, v.negate()))),
                                grid.get(line1[len1]).neq(network.valueForDirections(v, v.negate())),
                                ...line2
                                    .slice(1, len2)
                                    .map(p => grid.get(p).eq(network.valueForDirections(w, w.negate()))),
                                grid.get(line2[len2]).neq(network.valueForDirections(w, w.negate()))
                            )
                        );
                    }
                }
            }
        }
        cs.add(Or(...choices));
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
    name: "Balance Loop",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRPj9o+EL3zKVY++0D+0EJu2+3SC6XdQrVCUYQMeJdoE0ydpFsZ8d13ZpwqOEml3++w6h4qk9HjeTLzHPu5+FEJLfkIRjDmQ+7B8P0xPeEQf7/HMi0zGV3x66rcKw2A8y/TKX8QWSEHcZ2VDE5mEpk7bj5FMfMYZz48Hku4uYtO5nNkVtwsYIpxD7iZTfIB3jbwnuYR3VjSGwKeWxwCXAHcpnqbyfXMFvoaxWbJGfb5QG8jZLn6KVmtA/9vVb5JkdiIEhZT7NNjPVNUO/VU1blecubm2spd9MgNGrkIrVxEPXJxFa8sd5Kcz/DZv4HgdRSj9u8NHDdwEZ0gzqMTC8b4agha7N6w0K+JkAhI8yh5hckezPmg5nIFtsS4zVKdTu6oN3c06bLQckqNfYpLEM5NQPEjxSHFEcUZ5dxSvKd4QzGk+I5y3uPS/9fHuVz7K8mJfeszHKP/hpJBzOZVvpH6aq50LjI4CIu9OEoGjmOFytZFpR/EFs4PGRKOCHAHesOhMqWOWXpw89LHg9KydwpJuXvsy98ovWtVfxZZ5hD2enEou98OVWo45hf/hdbq2WFyUe4d4sISTiV5KF0BpXAliifR6pY3az4P2C9GTxzAdRb8u87+0nWGWzB8a759a3Lo9Crda32ge9wPbK/La75jdOA7lsaGXVcD22NsYNveBqprbyA7DgfuDybHqm2fo6q21bFVx+3Y6tLwcTJ4AQ==",
            answer: "m=edit&p=7VRNb9pAEL3zK6I9z8HeXQP2LU1DL5Q2hSpCFkIGnGDFYGqbpjLiv3d2xgaMXak9RO2hWjx6vJ2Znf14k33bB2kIDg7VBwtsHFL26dOW+VVjEuVx6N3A7T5fJykCgE+DATwFcRZ2/NJr1jkUrlc8QPHB84UtQEj8bDGD4sE7FB+9YgrFGKcE2MgN2UkivD/DR5o36I5J20I8YqwRThEuo3QZh/MhJ/rs+cUEhFnnHUUbKDbJ91CUdZj/y2SziAyxCHLcTLaOduVMtl8lL/vS154dobjlcsct5apzuepUrmovV759ue7seMRj/4IFzz3f1P71DPtnOPYOR1PXQai+CdVYC9+N0LIkNBHoZpPz1DjbOCehvgNO0b9mKU/D12n1ddwmi0sOaGFJdoKFQ6HIvidrkXXIDsnnnuwj2TuymmyXfHpm63g4lzm6VbSQFkjcnQJCLiPz/hlJkIqRAqkZaVAl54I5A0TKAmWfEGdRNijOomQVgfrSPUYuCouQkRjHahs0R2gJTsn1wOkywli3Qg5n0S44XIFjVREGsZ/TrfycPnOnwxqR5RvmAx1Xt306dHOgx44vuSOY4fwemnV8MdpvFmF6M0rSTRDjkx2vg10osDeILInn2T59Cpb40ql1AHFbiqhRcZLs4mhb94uet0katk4ZMlw9t/kvknR1lf01iOMakVEjrFH8MmtUnka1/0GaJq81ZhPk6xpxId5apnCb1wvIg3qJwUtwtdrmvOdjR/wQ9PkKG6/633j/UuM1V2D9Ufu97K5v1vD+rXLo9SZpq/SRblE/sq0qL/mG0JFvSNos2FQ1si3CRvZa20g15Y1kQ+HI/ULkJuu1zk1V11I3SzXUbpa6FLw/6/wE",
        },
    ],
});
