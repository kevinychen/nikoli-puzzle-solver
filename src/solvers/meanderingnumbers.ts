import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Distinct, Not }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell to make a path in each region
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    cs.add(...Array.from(grid.values(), arith => arith.ge(1)));

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Within each region, two consecutive numbers must be orthogonally adjacent
    const [_, paths, order] = cs.PathsGrid(puzzle.points);
    for (const [p, q, v] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Not(paths.get(p).hasDirection(v)));
        }
    }
    cs.add(...Array.from(grid, ([p, arith]) => arith.eq(order.get(p).add(1))));

    // Numbers must be between 1 and N, where N is the size of the region
    // Each region contains exactly one of each number
    for (const region of puzzle.regions()) {
        cs.add(Distinct(...region.map(p => order.get(p))));
    }

    // Two equal numbers cannot be horizontally, vertically or diagonally adjacent
    for (const [p] of grid) {
        for (const q of puzzle.points.vertexSharingPoints(p)) {
            cs.add(grid.get(p).neq(grid.get(q)));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        if (!puzzle.texts.has(p)) {
            solution.texts.set(p, model.get(arith).toString());
        }
    }
};

solverRegistry.push({
    name: "Meandering Numbers",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb5swFH3Pr6j87IcYkgV467pkL1m2rpmqCqHISWiDCnFnYJ2I8t97rqElfFTTNE3rw0S4ORxf+x7je0i/51KHfITLdviQC7pc/ON2Bf2G1bWMsjj0zvh5nu2UBuD882zGb2WchgO/ygoGh8L1iktefPR8JhhnFm7BAl5ceofik1dMeXGFIcYFuHmZZAFOa3htxgldlKQYAi8qDHgDuIn0Jg5X85L54vnFkjOq897MJsgS9SNklQ563qhkHRGxlhk2k+6ih2okzbfqPq9yRXDkxfnrcu1aLsFSLqEeubSLvyzXDY5HvPavELzyfNL+rYZODa+8A+LCOzBL0FScjCjPho2sNjEmYvRMYJ4ws29MnJlombjE4rywTfxg4tDEsYlzkzNFzcmYOzbzLM4cG21lEDWYWyIXb23yQkIOIYu75RTXeUmccNcBwqrXZu0LE0cmvjM1J7Td33ohf769X8rxhVN6i4/7/4OBz6bbu/BsoXQiYxz0Ik/WoX5+hrNYquJVmutbuUGfGOOhFcDtTWaDipV6iKN9My+62ysd9g4RGaJ8T/5a6W1r9UcZxw2i/Iw0qLLjG1Sm0c4nz1Jr9dhgEpntGsRJ6zdWCvdZU0AmmxLlvWxVS+o9HwfsJzO3b+OzZf//bP2jzxYdwfCtefWtyTHdq3Sv9UH3uB9sr8srvmN08B1LU8Guq8H2GBts29uguvYG2XE4uFdMTqu2fU6q2lanUh23U6lTw/vB4Ak=",
            answer: "m=edit&p=7VRNj5swEL3nV6x89gFsEj5u223SS5p2m62qFYoikrAbtBBvDXQrIv57ZwxJsGGlVlXVHirCZHgee57HfpN/LSMZUwce7lGL2vj4lnp9G39W+9wlRRoHV/S6LPZCgkPph9mMPkRpHo/CNmo1OlZ+UN3S6l0QEptQwuC1yYpWt8Gxeh9UU1otYYhQG7B5E8TAnV7cL2ocvZsGtC3wF60P7j2420Ru03g9b5CPQVjdUYJ53qjZ6JJMfItJywO/tyLbJAhsogI2k++T53YkL3fiqSSnFDWtrl+nyy90+ZkuH6bL/jxdf1XXUPZPQHgdhMj988X1Lu4yONbI60iYjVPhZOzmbIjDTGCMgHMCYJ6tZt8rO1OWKXsHi9OKK/tWWUvZsbJzFTOFnO6YepwEjBKPw7VSHl4wv/F8qJp7BlnjMeo3U3zvHOhS3wOvxrrj2jfKOspOVE4XtwsF6XKa6GzaOtheW0LWbtv22zqcAGYZEWzSFuYMuAjwDuCZEb4RwR0Exh1AVXvSASYGD+4aPBxuAo6W5XxizWksO6fXnBhWrx6FttdIno6H/1ejkEx3j/HVQsgsSuH+LcpsE8vTNwie5CJd56V8iLZwfVU/oAo7qEgNSoV4TpODHpc8HoSMB4cQjCH9QPxGyJ2x+kuUphqQq+6mQY0QNaiQifYdSSleNCSLir0GdBSprRQfCp1AEekUo6fIyJZd9lyPyHei3pBDN+X/u+lf6qZ4BNYv9dTf75A/0dH+LTrq9go5KH2AB9QP6KDKW7wndMB7ksaEfVUDOiBsQE1tA9SXN4A9hQP2ishxVVPnyMqUOqbqqR1TdQUfrkY/AA==",
        },
    ],
});
