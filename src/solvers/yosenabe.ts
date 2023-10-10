import { Constraints, Context, Point, Puzzle, Solution, UnionFind, ValueMap } from "../lib";

const solve = async ({ If, Implies, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines to move every circle into one of the pots (denoted by a group of gray cells)
    const [network, grid, order] = cs.PathsGrid(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.neq(0), Or(arith.isLoopSegment(), order.get(p).eq(0)).neq(puzzle.symbols.has(p))));
        if (puzzle.symbols.has(p)) {
            cs.add(arith.neq(0));
        } else if (!puzzle.shaded.has(p)) {
            cs.add(Not(arith.isTerminal()));
        }
    }

    // A circle can be moved horizontally or vertically, but cannot make a turn
    for (const [_, arith] of grid) {
        cs.add(Implies(arith.isLoopSegment(), arith.isStraight()));
    }

    // Create grid where every cell on a path has the value of the starting circle
    const values = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of puzzle.symbols) {
        cs.add(values.get(p).eq(parseInt(puzzle.texts.get(p))));
    }
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Implies(grid.get(p).hasDirection(v), values.get(p).eq(values.get(q))));
    }
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.eq(0), values.get(p).eq(0)));
    }

    const uf = new UnionFind<Point>();
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.shaded.has(p) && puzzle.shaded.has(q)) {
            uf.union(p, q);
        }
    }
    for (const [p] of puzzle.shaded) {
        if (uf.find(p).eq(p)) {
            const region = [...puzzle.shaded.keys()].filter(q => uf.find(q).eq(uf.find(p)));
            const numberLocation = region.find(p => puzzle.texts.has(p));
            if (numberLocation !== undefined) {
                // Numbers indicate the sum of the values on the circles that are moved into the pot
                const number = parseInt(puzzle.texts.get(numberLocation));
                cs.add(Sum(...region.map(p => If(grid.get(p).isTerminal(), values.get(p), 0))).eq(number));
            } else {
                // A pot without a number must have at least one circle
                cs.add(Or(...region.map(p => grid.get(p).isTerminal())));
            }
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        for (const v of network.directionSets[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Yosenabe",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRNb9pAEL3zK6I978GfBHxL09ALpU2hitDKQgs4wYrN0rXdVEb898zMGuGvSrlEzaFaPDu8Hc+83fHb7FchdcR9GO6IW9yG4TgjejwLf+exiPMkCq74TZHvlAaH82+TCX+USRYNRBUVDo7lOCjvefklEMxmnDnw2Czk5X1wLL8G5ZKXc1hi3AVsaoIccO8u7gOto3drQNsCf1b54C7B3cR6k0SrqUG+B6JccIZ1PtHb6LJU/Y5YxQP/b1S6jhFYyxw2k+3iQ7WSFVv1XFSxdnji5Y2hOz/TxSoVXWRe0UXX0EWvhy7u4p3pjsPTCY79BxBeBQK5/7y4o4s7D47McVjgQlNcM3k0uWOaPMtMNk3+0EzXNA1xDXLMMAf4gvmwE9NZSiqYdwFcSCGw82fAo4ga4FOO2itYTrBhDRidu0EA1LaDI9jlmQHgjUM1VTsole6gVL+LYs0WCiUnVNghu4Cz5KVL9jNZi6xPdkoxd2QfyN6S9cgOKeYau/HGfpkTr+/9negIx0gfh/82LxwINi/0o9xE8FXOinQd6auZ0qlM4P98Jw8Rg+uAZSpZZVVcQLcFfL+A7emNBpQodUjifTMuftorHfUuIRhtn/ri10pvW9lfZJI0AHP3NSDT+QaUa9Bg7b/UWr00kFTmuwZQ02sjU7TPmwRy2aQon2WrWnrZ82nA/jB6hAt3rfv/rv1Hdy22wPpoCv5odOjrVbpX+gD3qB/QXpVXeEfogHckjQW7qga0R9iAtrUNUFfeAHYUDthfRI5Z2zpHVm2pY6mO2rFUXfAiHLwC",
            answer: "m=edit&p=7VRNb5tAEL37V0R7ngPsAra5pWnci+s2daooQpaFbRKjgHH5aCos/ntnZxdjPirlErWHCpgd3i47b3Z4k/0o/DQAGy8xAQNMvDif0GMZ8q6v+zCPAvcKrot8n6ToAHyZzeDJj7Jg5OlVq9GpnLrlHZSfXI+ZDBjHx2QrKO/cU/nZLR+hXOIUA4HYXC3i6N427gPNS+9GgaaB/kL76D6iuw3TbRSs5wr56nrlPTAZ5wN9LV0WJz8DpnnI920Sb0IJbPwck8n24VHPZMUueSlYHaKC8lrRXdZ0zYauaOiKM10xTJe/P93pqqrw2L8h4bXrSe7fG3fSuEv3xDhnrsCiCDVYNIgpDZahBpMG21HDmAZHzlUyK9zDkIFtzERVljb1mNUAwpQAbwCLdwDb6Hwiw3nMuQAmdTUIwNime6rkYWoGiLcOVUXtoRS6h9qDO1DMDoohZxSYk73Hs4RSkP1I1iBrk53TmluyD2RvyFpkHVozltXAel3u4dRfY2rAp7pGIHS1pqhNVSkTdJUEB10olK011pUDW9eQg61mrTHUlTTBMXRNQWYqzlQXZNX5qnSW9VmfU5bpVCOPqxYhL/tt3mrksWWRPvnbAP/eRRFvgvRqkaSxH+H7cu8fA4Ztg2VJtM70Ope6ChB2oC9aUJQkxyg8tNeFz4ckDQanJBjsnofWb5J019n91Y+iFpBRj2xB6g9pQXkatt79NE1eW0js5/sWcKHr1k7BIW8TyP02Rf/F70SLm5yrEfvF6PEE9mTxvyf/pZ4sS2C8sTN3VKiU9z6N59+iQ39vkg5KH+EB9SM6qHKN94SOeE/SMmBf1YgOCBvRrrYR6ssbwZ7CEfuDyOWuXZ1LVl2py1A9tctQl4L3VqPf",
        },
    ],
});
