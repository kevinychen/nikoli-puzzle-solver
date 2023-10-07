import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // Every country must be visited exactly once
    const regions = puzzle.regions();
    for (const region of regions) {
        cs.add(
            Sum(
                ...region.flatMap(p =>
                    puzzle.points
                        .edgeSharingNeighbors(p)
                        .filter(([q]) => puzzle.borders.has([p, q]))
                        .map(([_, v]) => grid.get(p).hasDirection(v))
                )
            ).eq(2)
        );
    }

    // A number indicates how many cells inside the country are visited by the loop
    for (const [[p], text] of puzzle.edgeTexts) {
        cs.add(Sum(...regions.get(p).map(p => grid.get(p).neq(0))).eq(parseInt(text)));
    }

    // Two adjacent cells in different countries cannot both be unused by the loop
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Or(grid.get(p).neq(0), grid.get(q).neq(0)));
        }
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
    name: "Country Road",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTRT9s8FMXf+1cgP/uhtuMAeWMM9sL6jcGEUFShtASoSGs+Nx1Tqv7vnHvj0KbNNIlpGg9TlKufT67ta8fH8/8Xmc9ljMccyL5UeHQc86uiiN9+eC4nZZEne/JoUT44D5Dyv9NTeZcV87yXhqxhb1kdJtW5rD4lqVBCCo1XiaGszpNl9TmpBrK6wCchFbSzOkkDT9Z4xd+JjmtR9cEDsKm7XQPHEz8u8puzWvmSpNWlFDTPB+5NKKbuey5CHdQeu+loQsIoK7GY+cPkKXyZL27d4yLkquFKVkd1uRcd5Zp1uYR1uUTb5Yb1/OFyD4erFbb9Kwq+SVKq/dsaD9Z4kSwRBxxVshS2H70uWAprNLXqHRZxdEAt/DzejGvudMpRc7zEmLIyHD9y7HO0HM845wSTKK2l0kYkGsdAmTVrYhTAjJNmAhs+dTVHyNlkG/pajNlwRIzSuS84Ckzz0pJYx7lu2IKbfIsx4zBODN5vxkQNNsxrwXHgmNgGtsgPbMGNTmzjwHCR3Q81gM0GRyEnopzABn1Nw7QnYUwFXQfWlEOMDb7ibT7mGHGMefv36Ye/4Uj8zp/+ZTkp/ZHXB6t4Kw97qTi5vc/3Bs5PswKWGCymo9w3bdxBYu6Km/nC32VjOIqvKJgG2owzW1Lh3FMxmbXzJvcz5/POTyTmmL4jf+T87dboz1lRtIT6ym1J9d3QkkoP42+0M+/dc0uZZuVDS9i4JFoj5bOyXUCZtUvMHrOt2abrNa964ofgNzW44M2/C/4vXfD0C/rvzdPvrRw+vc53Wh9yh/uhdro86DtGh75jaZpw19VQO4wNddvbkHbtDXHH4dB+YnIaddvnVNW21WmqHbfTVJuGT4e9Fw==",
            answer: "m=edit&p=7ZXfb5swEMff81dUfr6H+Cctb13X7qXL1rXTFKGoIiltUUnogKwTEf/77mwTQsKkqdO0PUwI68PXZ/s439nl13VcJGDwkccwBo6PMMa+XCn7jv1zk1ZZEh7B6bp6zAsEgA8XF3AfZ2UyirzVbLSpT8L6Cup3YcQ4Aybw5WwG9VW4qd+H9QTqa+xiwFG7dEYC8bzDL7af6MyJfIw8QZZu2BRxkRaLLLm9dMrHMKpvgNE6b+xoQrbMvyXM+0Hfi3w5T0mYxxX+TPmYPvuecn2XP629LZ81UJ86d68H3JWdu3Lrrhxw1//PH3b3ZNY0GPZP6PBtGJHvnzs87vA63DTkF7U83DA9VtsfBqalYNsIM6OO6Uv4YEztoAvbCtve4JxQS9u+te3Yttq2l9bmHBfhQgAXkoUC04DLjgWx8oyZJj1Lm3WOleyz9mO16FgRCz8WWXmmdWWr84417+w1zmn8PAY5aOdEH7RfVyMbz4ZYe9Zo71nrTifWxjNWkQ68D8hyh5W3UaazlzhWmi4O0s/JUReehfZ6Q5lHYT6zrbKtseEPaMMxJXa3x7QbwzAytAkSiCgsRBJoM4gU0FJEGqQjjKtydughOUhkQDnCHdCuF/dIqZa0WwNjqb2GIwJHAWhHuJPGjcW9MG4ERty4EToA4+yMaHtxDwLXi2dU22sgcL4E2Ot8DrTTXB7uJn7T5qoriOlOPlNAm1FEubN99Ot5NorY+d1DcjTJi2WcYfFO1st5UrTfeFqyMs9uy3VxHy+w9u1hClZbWcuelOX5c5au+nbpwyovksEuEhNcfsB+nhd3e7O/xFnWE0p7OfQkd4r1pKpIe99xUeQvPWUZV489Yec4682UrKq+A1XcdzF+ivdWW3b/3IzYd2bfSOJVJP9fRX/pKqItGL/iQvqde+YXDsN/yx2bvXkxWPooD1Q/qoNV7vWDQkf9oKRpwcOqRnWgsFHdr22UDssbxYMKR+0nRU6z7tc5ebVf6rTUQbXTUrsFH81GPwA=",
        },
    ],
});
