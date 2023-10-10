import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap, Vector } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place several pencils into the grid, and draw lines into the other cells
    const directions = puzzle.lattice.edgeSharingDirections();
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    const pencilTipGrid = new ValueMap(puzzle.points, _ => cs.choice(directions));
    const [network, paths, order] = cs.PathsGrid(puzzle.points);

    // Some pencil tips are given
    for (const [p, symbol] of puzzle.symbols) {
        const [v] = symbol.getArrows();
        cs.add(pencilTipGrid.get(p).is(v));
    }

    // A pencil consists of a rectangle with a width of 1
    // One of the short ends is attached to the pencil tip, which occupies another cell
    const maxLength = Math.max(puzzle.height, puzzle.width);
    const strips: Vector[][] = [];
    for (let len = 2; len <= maxLength; len++) {
        strips.push(range(len).map(i => directions[0].scale(i)));
    }
    const placements = puzzle.points.placements(strips);
    const sizeGrid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                And(arith.eq(-1), pencilTipGrid.get(p).eq(-1), sizeGrid.get(p).eq(-1)),
                ...placements
                    .get(p)
                    .flatMap(([placement, instance, type]) =>
                        [placement, [...placement].reverse()].map(placement =>
                            And(
                                ...placement.slice(1).map(p => grid.get(p).eq(type)),
                                ...placement.slice(1).map(p => pencilTipGrid.get(p).eq(-1)),
                                ...placement.slice(1).map(p => sizeGrid.get(p).eq(strips[instance].length - 1)),
                                grid.get(placement[0]).eq(-1),
                                pencilTipGrid.get(placement[0]).is(placement[0].directionTo(placement[1])),
                                sizeGrid.get(placement[0]).eq(-1),
                                paths.get(placement[0]).isTerminal()
                            )
                        )
                    )
            )
        );
    }

    // Lines must start at a pencil tip, and cannot connect to other pencil tips
    for (const [p, arith] of paths) {
        cs.add(Implies(arith.neq(0), Or(arith.isLoopSegment(), order.get(p).eq(0)).eq(pencilTipGrid.get(p).eq(-1))));
    }

    // Lines cannot go through pencils
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.neq(-1), paths.get(p).eq(0)));
    }

    // Every line must be the same length as its connected pencil
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Implies(pencilTipGrid.get(p).is(v), order.get(p).eq(sizeGrid.get(q) || -1)));
    }

    // Numbers must be placed inside pencils, and indicate the length of the pencil
    for (const [p, text] of puzzle.texts) {
        cs.add(sizeGrid.get(p).eq(parseInt(text)));
    }

    // Every cell in the grid must be used by a pencil or a line
    for (const [p, arith] of grid) {
        cs.add(Or(arith.neq(-1), paths.get(p).neq(0)));
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }

    // Fill in solved pencil tips
    for (const [p, arith] of pencilTipGrid) {
        const value = model.get(arith);
        if (value !== -1) {
            solution.symbols.set(p, Symbol.fromArrow("pencils", directions[value]));
        }
    }

    // Fill in solved paths
    for (const [p, arith] of paths) {
        for (const v of network.directionSets[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Pencils",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb9owFL7zV1Q++5AfsNHcuq7swtg6mKoqipABt0R1MHOSdTLif+97L+kSk1TaDtV6mIyfvnx+tj/j9zn/UQoj+QhaOOYe96EFwZj60MPfc1ukhZLRGb8oi602ADj/MpnwO6FyOYjrrGRwsOeRveb2UxQzn3EWQPdZwu11dLCfIzvjdg5DjPvATaukAOBVA29oHNFlRfoe4FmNAd4C3MvdOlV5RXyNYrvgDLf5QJMRskz/lKyWgd9rna1SJFaigLPk23Rfj+TlRj+Uda6fHLm9qNTOe9SGjVqElVpEPWrxEKh2nZq1ksvpK8g9T45H+Ne/geBlFKP27w0cN3AeHSDOogMLPJw6BC3V1bDAfz56TYSUAVf3mwgdAhbyablbWG4YwNiQOzfCRmMgIblFQvqEJgUUFyCL25DiR4oexRHFKeVcUbyheElxSPEd5bzHg/3V0du6X0lOHFQmwjb6M5QMYjYrs5U0ZzNtMqHgmudbsZcM7MRyrZZ5ae7EGqqD3AYFANyOZjiU0nqv0p2bl97vtJG9Q0jKzX1f/kqbzcnqj0Iph6jeDoeq6tyhCgNF3PoWxuhHh8lEsXWIVsE7K8ld4QoohCtRPIiT3bLmzMcB+8WoxyG8VeH/t+rfvFV4A95bs+1bk0PFq02v84HuMT+wvSav+Y7Pge84GjfsmhrYHl8De2ptoLruBrJjcOBe8DiuempzVHXqdNyqY3bcqu33OBk8AQ==",
            answer: "m=edit&p=7VRRb9owEH7nV1R+vofYTiDJW9eVvTC2DqaqihAKkJaoCWFJWKcg/nvP50BiyKTuodoeJpPjy+fz+XPOd8WPXZhH4OCQLljAcQjh0mNb6ncc07hMIv8KrnflOssRAHwZDuExTIqoF9Res96+8vzqDqpPfsA4Aybw4WwG1Z2/rz771RiqCU4x4MiNtJNAeNvAe5pX6EaT3EI8rjHCB4TbaLOMk0ITX/2gmgJT23ygxQqyNPsZsVqGel9m6SJWxCIs8SzFOt7WM8VulT3v2HGHA1TXWu2kQ61s1MqTWtmtVtRql3G+TKL56B3kerPDAb/6NxQ89wOl/XsD3QZO/P1B6dozYamlNmrRqWGCH49eE5I8RIuQBoGBOIV7wHC2wDkbjIwwx0WSGyS6D2mRIDtFWVBJsh/JWmQdsiPyuSV7T/aGrE22Tz4DdTA8ejtG/7iaCQECVUsUL8DmGnl4o0/IJWRzcDRnC3C0n+2CM9DIA0f7ORz62s/p61ktkHkCU67XeRKhIIhUCysXLcZzENqNC9cx8R8xr3kMw+ulnDfYshHLmlc+dmutV2MPuNCKuRg0WKKP5C1c+0uMT99EX45TZnUyJqcsC5VleZZl2UV234f+my+Jvhgq6YdeIHRLUsN5G5r1AjbepYsovxpneRomWDSTdbiNGDYnVmTJvNjlj+ESa416FxC3oRUGlWTZNok3pl/8tMnyqHNKkdHqqct/keWrs+gvYZIYREGd2KB01zCoMo+N9zDPsxeDScNybRCt9mFEijalKaAMTYnhc3i2W9qc+dBjvxg9eAEs7H//O/9f6fwqA9Yf9f928363nvxvyaHLm+WdlY90R/Ej21nkNX9R58hfVLTa8LKoke2oa2TPSxupy+pG8qLAkftNjauo52WuVJ1XutrqotjVVu16D2a9Vw==",
        },
    ],
});
