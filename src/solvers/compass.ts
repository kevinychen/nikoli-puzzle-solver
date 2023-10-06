import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines over the dotted lines to divide the board into several blocks
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Each block contains exactly one cell with a compass
    const instance = cs.addConnected(
        puzzle.points,
        p => puzzle.symbols.has(p),
        (p, q) => grid.get(p).eq(grid.get(q))
    );
    cs.add(...Array.from(grid, ([p, arith]) => arith.eq(instance.get(p))));

    // A number in a compass indicates how many cells belong to its region that are further in the
    // indicated direction than the compass itself
    for (const [[p, v], text] of puzzle.edgeTexts) {
        cs.add(
            Sum(
                ...[...puzzle.points]
                    .filter(q => (q.y - p.y) * v.dy + (q.x - p.x) * v.dx > 0)
                    .map(q => grid.get(q).eq(grid.get(p)))
            ).eq(parseInt(text))
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Compass",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTfb9owEH7nr6j87If8gBLy1nVlL4ytg6mqoggZcEvUBDMnWacg/vfenUPBSSZNk6r1YTI53X13tr8z/pz/KIWWfADDD7jDXRieF9DXd/B3HPOkSGV4wa/KYqM0OJx/GY/5g0hz2Yvqqri3r0ZhdcurT2HEXMaZB5/LYl7dhvvqc1hNeTWDFOMuYBNT5IF7c3LvKI/etQFdB/wp+CMz7R7clcp2Is8N8DWMqjlnuM0Hmowuy9RPyWoaGMOUZYLAUhTQS75JdnUmL9fqqaxr3fjAqyvDdtbB1j+xRdewRa/Jtm6H2CZ6lcrF5A3ojuLDAU79GxBehBFy/35yg5M7C/dgp2TdcM+GlwGuAP8PUIJo9No+REPnPDccYtQ/RlRZ54K+i5F/jPyzymBAueOR3sOmPq7rUm+v/x7zvQ6wj+ya4KA9HRYeU08e2Tk0yyuf7EeyDtkB2QnV3JC9I3tNtk/2kmqGeFx/caCmwzeiE3lGmjgGf+bFvYhNy2wp9cVU6UykcHlmG7GTDETKcpUu8lI/iBXcOdIwXCvAtjTDglKldmmyteuSx63SsjOFoFw/dtUvlV43Vn8WaWoB5kWyIKMeCyo0SOMsFlqrZwvJRLGxgDMZWSvJbWETKIRNUTyJxm7ZqedDj/1i9EU+vID+/xfw37yA+A847022740OXV6lO5UPcIf4Ae0UeY23dA54S9G4YVvUgHboGtCmtAFqqxvAlsAB+43GcdWmzJFVU+m4VUvsuNW53qO49wI=",
            answer: "m=edit&p=7VRNj5swEL3zK1Y++4DtfAC37XbTS5p2m1SrCKHISdgNWohTProVEf+9Y+MkdqBSVWnVHipg9Pw8Mx4bvym+VTyP8RAe5mEXE3go9dQ3cOV7ehZJmcbBDb6typ3IAWD8aTLBTzwtYifUXpFzrP2gfsD1hyBEBGFE4SMowvVDcKw/BvUM13OYQpgAN22dKMD7C3xU8xLdtSRxAc8A+23YEuBGZAdeFC3xOQjrBUZymXcqWEKUie8x0mXIMYSsE0mseQl7KXbJQc8U1Va8VNqXRA2ub9tq5z3Vsku17Fwt66lWb0dVm+SbNF5N36BcP2oaOPUvUPAqCGXtXy/Qu8B5cGxkXdKS4IjGI09moKokGPnn7cNo7Jpz47EcDU4j35jzBkSO2GnEDE9vSMwjXcKiTOYl2Pp7iNEecuD1kMNuOCSeqD1RZRewWVwzZd8r6yo7VHaqfO6VfVT2TtmBsiPlM5bHBQdq5hjZ0chn8JehagZ326WAmcY+JsRtMQExEaJ58CfanxADQyzRsQRi6SkW/Ck1eK/FFHJSX2PgmfankIfptZhrYFiL6TwgaMLgRzLzFjSn82lvx9I4Q3k+jRPStifIZ/h7KHJCNKuydZzfzESe8RRu7XzHDzGC7oAKka6KKn/iG7jsqnlgxe1VhEWlQhzSZG/7Jc97kce9U5KMt899/muRb6+yv/I0tYhCtUKLamVrUWWeWGOe5+LVYjJe7izC0K+VKd6XdgElt0vkL/xqteyy58ZBP5D6Qgatl/1vvX+n9co/4P5BAz7L7W3a179Vjrq8Iu9VPtA94ge2V+Sa7+gc+I6i5YJdUQPbo2tgr6UNVFfdQHYEDtwvNC6zXstcVnWtdLlUR+xyKVPvYeT8BA==",
        },
    ],
});
