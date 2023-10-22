import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place an arrow in one cell of each country
    const grid = new ValueMap(puzzle.points, p => cs.choice(puzzle.lattice.edgeSharingDirections(p)));
    const regions = puzzle.regions();
    for (const region of regions) {
        cs.add(Sum(...region.map(p => grid.get(p).neq(-1))).eq(1));
    }

    // Some arrows are given
    for (const [p, symbol] of puzzle.symbols) {
        const [v] = symbol.getArrows();
        if (v) {
            cs.add(grid.get(p).is(v));
        }
    }

    // Two arrows which point toward each other form a pair
    // All arrows must be paired
    // Paired arrows must not be in adjacent countries
    // All cells between a pair of arrows must be empty
    const adjacentCountries = new Map(regions.map(region => [region, []]));
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            adjacentCountries.get(regions.get(p)).push(regions.get(q));
        }
    }
    for (const [p, arith] of grid) {
        for (const bearing of puzzle.lattice.bearings()) {
            const line = puzzle.points.lineFrom(p, bearing).slice(1);
            const v = bearing.from(p);
            const choices = [];
            for (let i = 0; i < line.length; i++) {
                if (!adjacentCountries.get(regions.get(p)).includes(regions.get(line[i]))) {
                    choices.push(
                        And(...line.slice(0, i).map(p => grid.get(p).eq(-1)), grid.get(line[i]).is(v.negate()))
                    );
                }
            }
            cs.add(Implies(arith.is(v), Or(...choices)));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value !== -1 && !puzzle.symbols.has(p)) {
            solution.symbols.set(p, Symbol.fromArrow("arrow_N_G", puzzle.lattice.edgeSharingDirections(p)[value]));
        }
    }
};

solverRegistry.push({
    name: "Toichika",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTfb9o8FH3nr6j87Ic44UeSt7aDvTC+dTBVVRQhA2mJmmDmJOsUxP/ee6+zgUk+Tao0rQ+TyeXk+HJ9bO5x8a2SOuF9GJ7PHS5wBPANTyDw4zRjkZZZEl7x66rcKg2A8/8mE/4osyLpRU1W3DvUQVjf8fpjGDHBOHPhESzm9V14qD+F9ZjXc5hiXAA3NUkuwPEJ3tM8oltDCgfwrMEAHwBKrdXLcra8MdTnMKoXnOFCN/RzhCxX3xPWCMH3tcpXKRIrWcJuim26b2aKaqOeqyZXxEdeXxu98w693kkvQqMXUYde3AbqXad6nSXL6R+QG8THI5z7FxC8DCPU/vUE/ROchweIM4qC4kN4YMKHMgNuHyjMTSjDpbiAArz2KH6g6FAcUJxSzhhqjYbc77PQ5cz3zlAgCFFLGc7lgUNo1Oe+azjxE2HfBQb5Z0g4w1/TTaILpKkDMPAIAQMsrgOi7knaLcU+xSFJHuGJvPnM3nY6v5UTCdgkjUH3d9yL2HjzlFzNlM5lBr0w38p9wsB1rFDZsqj0o1xDC5EpoUuA21X5KtEWlSm1z9KdnZc+7ZROOqeQTGDZjvyV0puL6i8yyyzCXDEWZcxgUaWGTj97p3a0mFyWW4s4c4VVKdmVtoBS2hLls7xYLT/t+dhjPxg9kQdXmvfvSvtbVxr+B857M+l7k0Ptq3Sn94HusD+wnTZv+JbTgW95Ghds2xrYDmcDe2luoNr+BrJlceD+x+VY9dLoqOrS67hUy+641Lnjo7j3Cg==",
            answer: "m=edit&p=7VRNb5tAEL3zK6I974EFbD5uTmrnkjptnaqykIXWNolRwOvy0VRY/PfMDth4gVRVDumlwoyf34533s7uvuxnwdOQWvCYDtUpk4+r4+sy+dGb5yHK49C7opMi34kUAKX3sxl95HEWan6TtdKOpeuVE1reej5hhBIDXkZWtPzqHcvPXjml5QKGCGXA3dVJBsBpC3/guEQ3Ncl0wPMGA1wC5GkqXoJ5cF1TXzy/fKBEFrrGv0tIEvErJI0Q+XsjknUkiTXPYTXZLjo0I1mxFc8FOdWoaDmp9S4H9JqtXvOs1xzWa3yAXndVVdD4b6A48Hwp/nsLnRYuvGMlhcnIMC69I2EOTDOiqkIYm2GGgfEBJqClifETRh3jCOMd5kxhLntMHYt4BiWOeYFchgjPVM0Z1NUR2RZ1jJpjJyQPnlsj5wIxfXwebhINIPUTdE1EwAAr61Ryb6S0G4wWxjFKtmVHoGeXSxqri+m0ql7w4tw2Ayr4rG3bLW4sMWyg7R5tWmqTT7Q9OIkFK/HNDn3eBrmmSvOZU99WOhr+Xmk+mW6fwqu5SBMew8FZ7PghJHBHSSbiICvSR76B84ZXmCK3L5J1mCpULMQhjvZqXvS0F2k4OCTJEMoO5K9Fuu3M/sLjWCEyNCSF2kTpJlapPI2U39gohUl4vlOIiyukzBTuc1VAzlWJ/Jl3qiXtmiuN/Cb4wn7pYAL/DfBfGaDcBP3dNvg+w/sLh/mjHB/aa+i0vKfkUAQ82Ai4p9C8N/gPV4/HXaSDXgH0gF0AO2gLDd9zBuB7HiAL9m0A2AEnALZrBkD1/QDIniUA94YryFm7xiBVdb1BlurZgyx16RD+SnsF",
        },
    ],
});
