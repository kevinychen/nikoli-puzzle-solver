import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Distinct, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).eq(0));
    }

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Numbers must be between 1 and N, where N is the size of the region
    const regions = puzzle.regions();
    for (const [p, arith] of grid) {
        if (!puzzle.shaded.has(p)) {
            cs.add(arith.ge(1), arith.le(regions.get(p).length));
        }
    }

    // Each region contains exactly one of each number
    for (const region of regions) {
        cs.add(Distinct(...region.map(p => grid.get(p))));
    }

    // Two equal numbers cannot be orthogonally adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(p).neq(grid.get(q))));
    }

    // Arrows point to the largest number of the (up to 4) orthogonally adjacent cells
    for (const [p, symbol] of puzzle.symbols) {
        const [v] = symbol.getArrows();
        for (const [q, w] of puzzle.points.edgeSharingNeighbors(p)) {
            if (!w.eq(v)) {
                cs.add(grid.get(q).lt(grid.get(p.translate(v))));
            }
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        if (!puzzle.texts.has(p) && !puzzle.symbols.has(p)) {
            solution.texts.set(p, model.get(arith).toString());
        }
    }
};

solverRegistry.push({
    name: "Makaro",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRRb9o8FH3nV1R+9kNswwp567p2Lx37+tGpqiKEDHULaiBdCOsUxH/vuTemSUiqVZOm9WEyOCcnx/aJ43PX3zc2dbKHZvoykApN6z7/uwH99u1qkcUuPJInm2yepABSfj0/l3c2XrtO5FXjzjYfhPmlzD+HkVBCCo2/EmOZX4bb/EuYj2Q+wiMhFbiLQqQBz0p4zc8JnRakCoCHHgPeANo0TZ4mw8l1Qf0XRvmVFLTQRx5OUCyTH054I3Q/S5bTBRFTm+Ft1vPFo3+y3twmDxuvVeOdzE9e92tKvwQLv4Ra/NJrkN/ZIp3FbnLxB+wOxrsd9v1/GJ6EEXn/VsJ+CUfhVmgtQiVF11+O+dLr4wLBEAJjaFYDm/zdwKpwi/7GD47A1/eeJ2ujMXnUa9C0WEONBc55Gc39FQzL3HD/ifuA+x73F6w5g6GBwV5jdQ2vgQaGeeBB9wWqACf6RYLzHaiSV0GBFXg18LhfwQOpNOwS1sclZt6P1RirvV6DN3s9Ya8x0BivYew9aFiuYu09K7yW6paY9p0xNGqvIf97HnjvJ6CxxGOLrnmjTrnvcv+BN/CYzsMbT0xxLKrH4Pe+1S/tRLSTvvXehsadSIw26Z2dOeTi7PbeHQ2TdGlj3A03y6lLy/vR3D46gfok1kk8WftRIZcv5AncikfUqDhJHuPFqq5b3K+S1LU+ItLBRot+mqS3B7M/2TiuEUUxrlFF2ahRWYqaULnnINWYpc3mNaJSP2ozuVVWN5DZukX7YA9WW5bvvOuIn4L/kUHxN/+K/98q/vQNgvcW6Pdmh49vkrZmH3RL/MG2xtzzjaSDb2SaFmzGGmxLssEehhtUM98gGxEH90rKadbDoJOrw6zTUo2401LVxEfjzjM=",
            answer: "m=edit&p=7VVNj5swEL3nV6x89gHbkAC37TbpJU27zVarCkURSdgNWhJSIN2KiP/eGeMEbFgpqlS1hwowj8d8PMyMnX8/hllEHTiESy3K4ODclZdt4Xk+HuIiifwbensstmkGgNJPkwl9CpM8GgTKajE4lZ5f3tPygx8QRijhcDGyoOW9fyo/+uWclnN4RSgDblobcYDjBj7K94juapJZgGcKA/wGMMyy9HU5Wz7W1Gc/KB8owUTvpDtCskt/REQJwed1ulvFSKzCAr4m38YH9SY/btKXIznnqGh5+7Ze0egVF72iXy9Xetdxtk6i5fQPyPUWVQXz/gUEL/0AtX9toNvAuX8inBOfUWKr20jeHBduFUo+ESEwqgCZ8r8By/xThd9QOwfA63Mvg/XREDxwOjQm61hDgolMw+X4AIJpKeT4Xo6WHB05TqXNGAR5AuYasnPQanHAQmLPvkBmsZYJ1LfFGp5ZNWbAM09ht4U9yrhbYz5qsOSVLwdfruw58MJtYWUjwEZ4Law0cK5jrjQz+CxmN5gr/Qxs2NkG9fMGn/VYQvEVFiZO1J0cbTkO5QSOsB6gYtoTPNSnVlUDRq3LuO5iwhkSvEUI08JGwm4RnuEiLFViF4IZMQQ3XVzTwgxqm0FtZuiwXdPCM4I6lhHUYYaLMzRdRqaLGXSoB700VF3R83NzXaoef1o1CHi9FuPhXIcWg4DMj9lTuI5glRhvnqObWZrtwgSeZsfdKsqa5/k2PEQEVmuSp8kyV16+XMyp5PbSQ6OSND0k8V63i5/3aRb1vkIyAhk99qs02xjRX8Mk0Yhcbk0aVS+iGlVksfYslxWN2YXFViNaq6kWKdoXuoAi1CWGL6GRbdd8czUgP4m8AgFbofi/Ff6trRD/gXXlhlivc+1d7ve2oitW239LjizfNOvtfaB72h/Y3jZXfKfTge/0NCbstjWwPZ0NrNncQHX7G8hOiwP3RpdjVLPRUZXZ65iq0+6Yqt3xwWLwCw==",
        },
    ],
});
