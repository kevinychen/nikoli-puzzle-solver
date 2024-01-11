import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Not }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a directional loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // All unshaded cells must be visited
    for (const [_, arith] of grid) {
        cs.add(arith.neq(0));
    }

    // Pick an orientation of the loop
    const loopDirection = new ValueMap(puzzle.points, p => cs.choice(puzzle.lattice.edgeSharingDirections(p)));
    for (const [p, arith] of loopDirection) {
        cs.add(Implies(arith.eq(-1), grid.get(p).eq(0)));
        for (const v of puzzle.lattice.edgeSharingDirections(p)) {
            cs.add(Implies(arith.is(v), grid.get(p).hasDirection(v)));
        }
    }
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Not(And(loopDirection.get(p).is(v), loopDirection.get(q).is(v.negate()))));
    }

    // Each time the loop exits a region containing a number, its visit to the next region must
    // consist of exactly that number of cells
    const regions = puzzle.regions();
    const remainingPathLen = new ValueMap(puzzle.points, _ => cs.int());
    for (const [[p], text] of puzzle.edgeTexts) {
        for (const q of regions.get(p)) {
            for (const [r, v] of puzzle.points.edgeSharingNeighbors(q)) {
                if (puzzle.borders.has([q, r])) {
                    cs.add(Implies(loopDirection.get(q).is(v), remainingPathLen.get(r).eq(parseInt(text))));
                }
            }
        }
    }
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(
            Implies(
                loopDirection.get(p).is(v),
                puzzle.borders.has([p, q])
                    ? remainingPathLen.get(p).eq(1)
                    : remainingPathLen.get(q).eq(remainingPathLen.get(p).sub(1))
            )
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Remembered Length",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRLb9s8ELz7VwQ870EPJxF1S1O7l9RfU/tDEAiCQdtKLEQyU0pqChn+79ldKnX0KAq0KJpDIWs1HC65Q5rD4kulTAJjfPwAHHDpkfjFV7r0c5pnkZZZEp7ARVVutUEA8N90CncqK5JR1GTFo30tw/oa6g9hJFwBwsPXFTHU1+G+/hjWE6jn2CXARe7KJnkIJ0d4w/2ELi3pOohniH077BbhOjXrLFleWeZTGNULEFTnHY8mKHL9NRGNDmqvdb5KiVipEhdTbNPHpqeoNvqhanLd+AD1hZU7H5DrH+UStHIJdeU26/nDcmV8OOC2f0bByzAi7f8fYXCE83CPccbRDffC94LvCwbhnznU4h3GhFtOm3L0OC5wFqh9ju85OhxPOV5xzgSnDVwIPBF6IAIPAt8iH08SIz5WlpMgsWTDoRRCAUhpkcRtPH8ZHIwtGoO0U0sPu+1o/CJuxnsgqSJKuWFBlxzHHM9Y6Dltxi9s1+/syU/lRG5gnQenw994FInJ5j45mWmTqwyPwazKV4l5aaPvRKGzZVGZO7XGU8S2xIOC3I4zW1Sm9WOW7tp56f1Om2Swi8gEyw/kr7TZdGZ/UlnWIuwl06KsH1pUafCwv2orY/RTi8lVuW0Rr4zRminZlW0BpWpLVA+qUy0/rvkwEt8Ev5GPl5r/71L7S5ca/QXOW/PqW5PDp1ebQesjPeB+ZAdd3vA9oyPfszQV7Lsa2QFjI9v1NlJ9eyPZczhyPzA5zdr1OanqWp1K9dxOpV4bPopHzw==",
            answer: "m=edit&p=7VRRb5swEH7Pr6j8fA9gk8TmreuSvXTdunaaKhRFJKUNKgkdkHUi4r/3zgdJCEyaNk3bw0S4fHw+25/P/px/3YZZBB4+SoMDLj3Gsa9x6efUz21cJJF/BufbYpVmCAA+TKfwECZ5NAjqrNlgVxq/vIbynR8IV4CQ+LpiBuW1vyvf++UEyhtsEuAid8lJEuHkAL/YdkIXTLoO4ivEirvdIVzG2TKJ5pfMfPSD8hYEzfPG9iYo1um3SNQ66HuZrhcxEYuwwMXkq/i5bsm39+nTts51ZxWU5yz3pkeuOshVe7mqR269nj8s18yqCsv+CQXP/YC0fz5AfYA3/q4iXRRdfyeU1PsFg1AjRzQVrkgzpU1tlDbe4ihQKhvf2ujYOLTx0uZMcFjtgpbClyC0BK0YKTxJFtljxZwB4+w5zUiDMYwMlnHcdNYeIw8MD20kNnNv/EesG9rQjBXtCgm6sNGzcWSFjqkYWK7jhYyaJQhX48kXvgJCcsTIgHQskg5Il5ELkvPkCJTHaAxUUUZqyEiD4lGkATW2SKHZJKMheIrRCDweRY3B476ebFo9jzmu8PEmVs0u8ObeHe0UFaAaBLQi+wz7/2eDQEzuH6OzqzRbhwkesKvtehFlzTc6WuRpMs+32UO4xPNpDQ+W29jMFpWk6XMSb9p58eMmzaLeJiIjnL4nf5Fm9yejv4RJ0iJye321KHZaiyqyuPUdZln60mLWYbFqEUeWa40UbYq2gCJsSwyfwpPZ1oc1VwPxXdg3UHhdqv/X5V+6LmkLnF+4NH/nZvyJS+nfkmNPb5r1Wh/pHvcj2+vymu8YHfmOpWnCrquR7TE2sqfeRqprbyQ7DkfuByanUU99TqpOrU5TddxOUx0bPpgNXgE=",
        },
    ],
});
