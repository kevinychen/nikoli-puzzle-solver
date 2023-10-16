import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place letters from the given range into some of the cells
    const letters = [...puzzle.parameters["letters"]];
    const grid = new ValueMap(puzzle.points, _ => cs.choice(letters));

    // Each row and column contains exactly one of each letter
    // Some cells remain empty
    for (const [line] of puzzle.points.lines()) {
        for (const c of letters) {
            cs.add(Sum(...line.map(p => grid.get(p).is(c))).eq(1));
        }
    }

    // A clue outside the grid represents the first letter seen in the corresponding row or column from that direction (ignoring empty cells)
    for (const [line, p] of puzzle.points.lines()) {
        if (puzzle.texts.has(p)) {
            cs.add(
                Or(
                    ...line.map((q, i) =>
                        And(grid.get(q).is(puzzle.texts.get(p)), ...line.slice(0, i).map(p => grid.get(p).eq(-1)))
                    )
                )
            );
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value !== -1) {
            solution.texts.set(p, letters[value]);
        }
    }
};

solverRegistry.push({
    name: "Easy As",
    parameters: "letters: ABC",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRfb9o8FMbv+RSVr32RPxAgd5SV3TC2vjBVVRQhA2mJGnDnJG8nI757zznJFuxk0naxrReTydHh52P7ceLH+ZdSqIQPofkj7nAXmu/06Qkc/H1rq7TIkvCKT8piLxUknH+czfiDyPKkF+E4aHHvpMehvuX6fRgxl3HmweOymOvb8KQ/hHrB9RK6GNRyPa+KPEhvmvSO+jGbVtB1IF/UOaT3kG5Ttc2S9bwin8JIrzjDda5pNKbsIP9PWK0D/2/lYZMi2IgCNpPv0+e6Jy938qmsa934zPWkkrvskOs3cjGt5GLWIRd38ZvljuPzGV77fyB4HUao/XOTjpp0GZ4gLsIT8wY4dApaqm/DvCGCyQUYW6DvIrhuwMAeEvjWpMHIqhh71hxjGvIdgDqXNN5TnFH0KK5gC1z7FN9RdCgOKM6p5obiHcUpxT7FgGqG+BJ+6TX9ATmRH1S+gTb8uSzuRWxRHjaJupozsBvLZbbOS/UgtnB4yI1wPoAdqchAmZTPWXo069LHo1RJZxfCZPfYVb+RamfN/iKyzADV3WKgygYGKhSc8Yv/Qin5YpCDKPYGuPCDMVNyLEwBhTAliidhrXZo9nzusa+MnsiH+87/d5f9pbsMP4Hz1qz61uTQ6ZWq0/qAO9wPtNPlNW8ZHXjL0rhg29VAO4wN1PY2oLa9AbYcDuwHJsdZbZ+jKtvquFTL7bjUpeGjuPcK",
            answer: "m=edit&p=7VRNj5swEL3zK1Y++4BxAoFbNt30kqbdZqvVCkURSdgNWhJvDXQrIv77jgcSYkOl9tCPQ0UYTZ7Hz882b7KvRSRj6sHDR9SmDB5uD/B1bfU7PXdJnsbBFR0X+U5ISCj9OJ3SxyjNYitkOJMtrWPpB+UtLd8HIWGEEgdeRpa0vA2O5YegnNNyAUMEamk5q4scSG/a9B7HVTapQWZDPm9ySB8g3SRyk8arWY18CsLyjhK1zjXOVinZi28xaXSo/xuxXycKWEc5bCbbJS/NSFZsxXNBTktUtBzXchc9cnkrl5/l8n65zu+X6y+rCo79MwheBaHS/qVNR226CI6V0nUkzlBNnYCW+m6I4ylgfAH4BjBgCrhugaE5xeUGqTsyKnzH4PC5BoA6hhofME4xOhjvYAu05BjfYbQxDjHOsOYG4z3GCcYBRhdrPHUIcEyXHG5ntjod7jYbcRqZ/LSRM+A3uk/AwDMB3+AYMoNj6BuAaxscLjM4XHOKZxsVHjc4RswEuMExGmgc5zuoz3dxcR/1HajzrayQu7SxPHSOn8qWVkjmxX4dy6sZgT5BMpGuskI+Rhv46rGNUMQOWKRBqRAvaXLQ65Kng5Bx75AC4+1TX/1ayK3B/hqlqQZk2BQ1qPavBuUy0f5HUopXDdlH+U4DLoysMcWHXBeQR7rE6DkyVtu3e64s8p3gG3Jo1Px/E/5LTVhdgf1LrfiPtLx/Sw5+vUL2Wh/gHvcD2uvyBu8YHfCOpdWCXVcD2mNsQE1vA9S1N4AdhwP2A5MrVtPnSpVpdbVUx+1qqUvDh0vrDQ==",
        },
    ],
});
