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
            answer: "m=edit&p=7VRdb5swFH3nV1R+9gMGEj7e2i7pS5atS6epQlHkJLRBhTgzsE5E/PdeX0iIgUlTpWl7mAg3J8c3vsfXPs6+F1xG1IHH9qhJmXp8E1+fqY/ZPA9xnkTBFb0u8p2QACj9NJ3SJ55kkRE2WUvjWPpBeU/LuyAkjFBiwcvIkpb3wbH8GJQTWi5giFAG3KxOsgBOWvgNxxW6rUlmAp43GOAjQC6leF3NVzc19TkIywdKVKEb/LuCJBU/ItIIUb83Il3HiljzHFaT7eJDM5IVW/FSkFONipbXtd7FgF671Wuf9drDeq1G7yaWmyRazf6AXH9ZVdD3LyB4FYRK+9cWei1cBMdK6VKRYXwMjoR5MM2I6g2FsSlmWBgfYAJa2hg/YDQxjjDOMGcCc7lj6jkksCjx7AvkM0R4pGrOor6JyHWoZ9UcOyF17vwaeReImePzcJNoAWmeoG8jAgZYVadSW6Ok3WJ0MI5Rsqs6Aj27XNJYX0ynVfWCF+e2WVAhZG3b7nBjieUC7fZo29GbfKLdwUkcWElod+jzNqg1VUbIvNqsdDT8vTRCMtk+R1dzIVOewMFZ7PghImBRkolklRXyiW/gvKGDKXL7Il1HUqMSIQ5JvNfz4ue9kNHgkCIjKDuQvxZy25n9lSeJRmR4H2lU7RyNymWs/cZGaUzK851GXFhImyna57qAnOsS+QvvVEvbNVcG+Unwhf0y4Q74f//9pftP7YH57lvwfffdb1ww/5YcPL5CDnof6AH7Azto84bvOR34nqdVwb6tgR1wNrBdcwPV9zeQPYsD9wuXq1m7Rlequl5XpXp2V6UuHR8ujTc=",
        },
    ],
});
