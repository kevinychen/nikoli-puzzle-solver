import { Constraints, Context, Puzzle, Solution, Symbol, ValueSet } from "../lib";

const solve = async ({ And, Implies, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw multiple lines through orthogonally adjacent cells
    const [network, grid] = cs.PathsGrid(puzzle.points);

    // Each region contains exactly one line covering all of the region's cells
    const regions = puzzle.regions();
    const regionRoots = new ValueSet(regions.map(region => region[0]));
    cs.addConnected(
        puzzle.points,
        p => Or(puzzle.shaded.has(p), regionRoots.has(p)),
        (p, q) => regions.get(q) === regions.get(p) && grid.get(p).hasDirection(p.directionTo(q))
    );

    // Lines cannot go across region borders
    for (const [p, q, v] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Not(grid.get(p).hasDirection(v)));
        }
    }

    // Lines cannot go through shaded cells
    for (const [p, arith] of grid) {
        cs.add(arith.eq(0).eq(puzzle.shaded.has(p)));
    }

    // The endpoints of lines cannot be horizontally, vertically or diagonally adjacent
    for (const [p] of grid) {
        for (const q of puzzle.points.vertexSharingPoints(p)) {
            cs.add(Not(And(grid.get(p).isTerminal(), grid.get(q).isTerminal())));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        const directionSets = network.directionSets(p)[model.get(arith)];
        for (const v of directionSets) {
            solution.lines.set([p, p.translate(v)], true);
        }
        if (directionSets.length === 1) {
            solution.symbols.set(p, Symbol.WHITE_CIRCLE);
        }
    }
};

solverRegistry.push({
    name: "Rassi Silai",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTBb5s+GL3nr6h89gGbZL/gW9dfskvXrUumqkIochLaoELcGVgnovzvfTbOCIFqPWxaD5PDl8fzZ/t9xs/5t1LqmI7Q/DH1KEPjfGyfoWd+hzZPijQWZ/S8LDZKA1D6aTqldzLN40HosqLBrgpEdU2rDyIkjFDC8TAS0epa7KqPoprRaoYuQhm4yzqJA04aeGP7DbqoSeYBXzkMeAu4SvQqjReXNfNZhNWcErPOezvaQJKp7zFxOsz7SmXLxBBLWaCYfJM8up68XKuH0uWyaE+r85fl+o1cA2u5BvXINVX8YblBtN9j279A8EKERvvXBo4bOBM7wodEMEpGY/yBuhI7RGbjrY1TG7mNc4yjlW/j/zZ6No5svLQ5E0wa+CiZE8HxpT0coGPMvBozHC0WODxuMAfPDzzy+SHfjHXzMA7sO4y1GIqwYwPKfFTyE7uxPub06zmDEeS4dG8IPAKG7Bsr/sLGoY3vbFH/ma165Wb+rv37pZzQbJJrqOc1KBqEZFbqO7mKcWQm6/v47ErpTKYEDiW5She56xXWwDhS4LZltox1i0qVekyTbTsvud8qHfd2GTLGcj35S6XXJ7M/yTRtEfV11KJq57SoQsMWR+9Sa/XUYjJZbFrEkYVaM8Xboi2gkG2J8kGerJY1Ne8H5AexT+jj+vP/XX9/6fozn8B7a759a3Ls6VW61/qge9wPttflju8YHXzH0mbBrqvB9hgb7Km3QXXtDbLjcHAvmNzMeupzo+rU6mapjtvNUseGD6PBMw==",
            answer: "m=edit&p=7VVdb5swFH3Pr6j8fB+wDQnw1nXJXtpuXTJNFYoqktIGlYQOyDoR8d97r21C+KjUh03bw0S4ORxf28cfx85/7MMsAgcf6YIFHB8hXPXaFv3qZxEXSeSfwfm+2KQZAoDPsxk8hEkejQKTtRwdSs8vb6D85AeMM2ACX86WUN74h/LKL+dQzrGIAUfuUicJhNMGflflhC40yS3E1wYjvEW4jrN1Et1dauaLH5QLYNTPB1WbINumPyNmdND3Ot2uYiJWYYGDyTfxsynJ9/fp057VXVRQnr8tVzZy5VGuHJYr/rxcb1lVOO1fUfCdH5D2bw10Gzj3D0zYzOfAHBf/KhJ5wMhVvFVxpqJQcYH1oJQqflTRUtFR8VLlTLFRT+KQBfMFrrTF25hbGnPcWtwz2G2wQF7UPOYLq8HctMMFYmkw9sVtU9cDLt0TbOpKbFPqNj0H5Zh0y0bsIK5ozUj8hYq2imM1qAlNFU7m6aDH9XAZihWc+RIU8jQSIGSNpCmVIIVGHpBCRCjKlBLSdSXW0HWlB7bOI9PpUpuDLWrkWBoJcHQr9uRYYwLOWCOvznM4jA0agzPRyNOcXrXO6uuVndc7gdE4A9wpZt9eqX3LSO0A6w6xtjXEkpYB1uuzxw1Ia1WNAqEPJ3qc96HlKGDzffYQriP0zfT+MTq7TrNtmDA8plieJne5KfXVKQaK2+23qyhrUUmaPifxrp0XP+7SLBosIjLC7gbyV2l232n9JUySFpGrM7lF6YlpUUUWt77DLEtfWsw2LDYt4uQcabUU7Yq2gCJsSwyfwk5v22bM1Yj9YuoNJN4B8v8d8JfuAFoC6503we86/N9xlv5bctTuTbNB6yM94H5kB11u+J7Rke9ZmjrsuxrZAWMj2/U2Un17I9lzOHJvmJxa7fqcVHWtTl313E5dnRo+WI5eAQ==",
        },
    ],
});
