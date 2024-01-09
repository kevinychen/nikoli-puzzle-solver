import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ Distinct, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    // Numbers must be between 1 and N, where N is the width of the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(1, puzzle.width));

    // Each row and column contains exactly one of each number
    for (const [line] of puzzle.points.lines()) {
        cs.add(Distinct(...line.map(p => grid.get(p))));
    }

    // A white dot indicates that the two adjacent numbers have a difference of 1
    for (const [p, q] of puzzle.points.edges()) {
        const symbol = puzzle.junctionSymbols.get(new ValueSet([p, q]));

        // A white dot indicates that the two adjacent numbers have a difference of 1
        const whiteCondition = Or(grid.get(p).eq(grid.get(q).add(1)), grid.get(p).add(1).eq(grid.get(q)));

        // A black dot indicates that the two adjacent numbers have a ratio of 1:2
        const blackCondition = Or(grid.get(p).eq(grid.get(q).mul(2)), grid.get(p).mul(2).eq(grid.get(q)));
        if (symbol !== undefined) {
            cs.add(symbol.isBlack() ? blackCondition : whiteCondition);
        } else {
            // All possible dots are given, meaning that the lack of a dot indicates that the
            // adjacent numbers must have a difference of more than 1, and cannot have a ratio of 1:2
            cs.add(Not(Or(whiteCondition, blackCondition)));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        solution.texts.set(p, model.get(arith).toString());
    }
};

solverRegistry.push({
    name: "Kropki",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTRb9owEMbf+SsmP/shdoBC3rqu2wtj68JUoShCBtwSNeDOSdYpiP+9d04kMDleJlXrwxRyufx82F/ifFf8qpTVvA9HOOIBF3iM4QrnWOAvaI9ZVuY6+sCvq3JjLCScf5vyB5UXupe0RWlvX4+j+o7XX6KECcaZhFOwlNd30b7+GtVzXscwxLgANmmKJKS3x/TejWN200ARQD5tc0jnkK4yu8r1Io4b9D1K6hlnuNBH93dM2db81qwVgvcrs11mCJaqhIcpNtlzO1JUa/NUtbUiPfD6utEbE3rDo15MG72YEXrxMU70Tt5A7jg9HOC9/wDBiyhB7T+P6eiYxtEe4tRF4eI82jPRv4J5JKzmvVHgI+CC4GOaDwb0PIMhzYeSnmcYXuB9kktBzyMFrV8K1N/VI2VA10vUT3H6vUl5Yd2Q0g+b8NlthXRxBjvF69DFTy4GLg5cnLiaWxfvXbxxse/i0NVc4V7/9dfwRnISMWoaCx/Q17SXsHijnjWDDsIKky+Kyj6oFdjBNRj44oHtqu1SWw/lxjzn2c6vyx53xmpyCKFeP1L1S2PXZ7O/qDz3QNMtPdRsp4dKC649uVfWmhePbFW58cCJw72Z9K70BZTKl6ie1Nlq2+MzH3rsD3NnEkJ7Dv+353/VnnEPgvdmy/cmx32+xpLeB0zYHyhp85Z3nA6842lcsGtroISzgZ6bG1DX3wA7Fgd2weU467nRUdW513Gpjt1xqVPHJ2nvFQ==",
            answer: "m=edit&p=7VVNj5swEL3zKyqffcA2kMBtu932kqbdkmoVoSgiCbtBS0LKR7ci4r93PLBJbJxLpVV7qAiT4Xk88xj7mfJHHRcJdeASY2pTJi/fxttn8mf31yytsiR4R2/qapsX4FD6ZUof46xMrKgPWljHxg+ae9p8CiLCCCUcbkYWtLkPjs3noJnTJoQhQhlgky6Ig3t3dh9wXHq3Hchs8Ke9D+4c3HVarLNkGYYd9DWImhklstB7nC5dsst/JqQnIp/X+W6VSmAVV/Ay5TY99CNlvcmfa/Jao6XNTcc3NPAVZ77ixFeY+XKV7+QN6PqLtoW+fwPCyyCS3L+f3fHZDYNjK3lJy9DOgyNhzgjycKp1FPAx4MyA+2bcdc15XM+Me9ycxxNXcMeIc2bOw5mZP2e+kQ/ntjmee1dwc984v1JXmPjDInzEpeBoZ7BStBFoP6C10bpoJxhzh/YB7S1aB62HMSO51rAbLnN4g9lTufCSJ3Fgi3YKJdgY3LM9gB0h4gJgEuAXgKdPGekRehXua0mxLwrgalOEpyUVI62sw7UIR2hJHUefolY5aaJrePiqj9OiyIa3VsTG3RFJXfP/wopIuI0PCYGzkJR5tizr4jFeg7DxqKSI7evdKikUKMvzQ5bu1bj0aZ8XiXFIgsnmyRS/youNlv0lzjIFKPHcV6BuYypQVaTKc1wU+YuC7OJqqwAXZ5WSKdlXKoEqVinGz7FWbXd+59YivwjekYAPjfj/oflbHxq5BvYff27e7Lz7t+jg9s0Lo/YBNsgfUKPMe3ygdMAHmpYFh7IG1KBsQHVxAzTUN4ADiQN2ReUyqy50yUrXuiw1kLssdan4aGH9Bg==",
        },
    ],
});
