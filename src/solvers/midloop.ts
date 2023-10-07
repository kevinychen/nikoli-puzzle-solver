import { Constraints, Context, Point, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop that goes through every circle
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // Each circle marks the center of the straight line segment it lies on
    const dots = new ValueMap<[Point, Point], [Vector, Vector][]>([]);
    for (const [p] of puzzle.symbols) {
        dots.set([p, p], puzzle.lattice.oppositeDirections());
    }
    for (const [[p, q]] of puzzle.junctionSymbols) {
        dots.set([p, q], [[p.directionTo(q), q.directionTo(p)]]);
    }
    for (const [[p, q], dirs] of dots) {
        const choices = [];
        for (const [v, w] of dirs) {
            const [line1, line2] = [puzzle.points.sightLine(p, v), puzzle.points.sightLine(q, w)];
            for (let i = 1; i < line1.length && i < line2.length; i++) {
                choices.push(
                    And(
                        grid.get(p).hasDirection(v),
                        ...line1.slice(1, i).map(p => grid.get(p).eq(network.valueForDirections(v, w))),
                        grid.get(line1[i]).neq(network.valueForDirections(v, w)),
                        ...line2.slice(1, i).map(p => grid.get(p).eq(network.valueForDirections(v, w))),
                        grid.get(line2[i]).neq(network.valueForDirections(v, w))
                    )
                );
            }
        }
        cs.add(Or(...choices));
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.getDirections(model.get(arith))) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Mid-Loop",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTBb9owFMbv/BWVzz4QGwLNreu6XRhbF6YKRREy4JaoATMnWacg/vc+P0cCJ+ZSqVoPk+Wnxy8v9heb7xW/K6ElDWHwMe3TAAYLQ5zBYICz34xZVuYyuqI3VblRGhJKv0/po8gL2UuaorR3qK+j+p7WX6OEBIQSBjMgKa3vo0P9LarntI7hEaEBsIktYpDe2XTch/wBCwy9tTQwdAr52L43h3SV6VUuF3Fs0Y8oqWeUmJ0+4esmJVv1R5JGifm9UttlZsBSlPA1xSbbN0+Kaq2eq6Y2SI+0vrGCY49gfhJsUqvXZG29zced6Z28g9zr9HiEg/8JghdRYrT/OqXjUxpHB4hTjAHGeXQgnMMyDDZzDpQMh14c+qvDgR+PvJix0M+5fxnO2AXuX4cP/Cr58BK/sE7oPwQ+uqBn5KuHc/6Cp80wzuAyaM0xfsbYxzjEOMGaO4wPGG8xDjCGWDMy1/nmC38nOQlj2D7sGL49T3sJiTdiLwl0E1KofFFU+lGswBnYbODPD2xXbZdSOyhXap9nO7cue9opLb2PDJTrJ1/9Uul1a/UXkecOsL3TQfbaHVRqMPDZb6G1enHIVpQbB5yZ3VlJ7kpXQClcieJZtHbbnr752CN/Cc6EQ6vm/1v1P2vV5hL6H82/H00O/n+V9pofsMf/QL0+b3jH6sA7pjYbdn0N1GNtoG13A+oaHGDH48Au2Nys2na6UdU2u9mq43ez1bnlk7T3Cg==",
            answer: "m=edit&p=7VVNb9pAEL3zK6o9zwHv7AfxLU3TXtK0KamiyEKRIU5AMTg10FRG/PfM7tiAYblEitpDZe3o8Twz+7zL253/WqZlBoYe7EEXInqkMX5ESvnRrZ/rySLP4g9wulyMi5IAwLdLeEjzedZJ6qRBZ1WdxNUVVF/iREQChKQRiQFUV/Gq+hpXt1D16ZWAiLgLTpIEzxn2uoRvfIJjz5iNHHtJuMd1twRHk3KUZ3f9PlPf46S6BuFm+ujLHRTT4ncmaiXu96iYDieOGKYL+pr5ePJcv5kv74unZZ0bDdZQnbLgfkAwbgXjRi8G9NYft6P34h3kngzWa1r4HyT4Lk6c9p9b2NvCfrxaO10uRj7exiuBSG0k7C2o0DpIm3C2UWHaBmkpTZjHcBuU8ggf7oMqrBL1Mf5IHxNeBLRH9NhQPq3zZ7/a0sdr2gyo0MdPPnZ91D5e+JxzH298PPNR+Wh8jnXbSRu+28M01bS4IOkz0S0zoGSEgDVH5rYNQsPIAjKHEhRXIILiClSAukFKMdJNLVpQXKskaK5V2OQpDco0SHMXZZoKLcFwhUbQqkGG59UKTM1pMFyrDWjbIMOdtQXDnJFguZ9BsNzFKLDcxeimwliwXGFlk2cpj+ewGiznWcN5mw3ZtQ5vWr+x0WZj3aatOwmtfbR59NvxoJOI/jh9zgSdrWJe5HfzZfmQjuic8EcveG62nA6zskXlRfGcT2btvMnjrCiz4CtHZvePofxhUd7vdX9J87xFzP1N0qLYBC1qUU5av9OyLF5azDRdjFvEztHX6pTNFm0Bi7QtMX1K92abbr953RF/hB8J0sWF/y+uv3ZxuU3ovvn6erfD9d+S4/+/RRk0P9EB/xMb9HnNH1id+ANTuwkPfU1swNrE7rubqEODE3ngceKO2Nx13Xe6U7VvdjfVgd/dVLuWTwadVw==",
        },
    ],
});
