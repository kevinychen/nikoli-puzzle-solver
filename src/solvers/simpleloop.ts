import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({}: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a loop that goes through every unshaded cell
    const [loop, grid, root] = cs.SingleLoopGrid(puzzle.points);

    // Optimization: start the loop at one of the empty cells
    cs.add(root.is([...puzzle.points].find(p => !puzzle.shaded.has(p))));

    // The loop cannot go through shaded cells
    for (const [p, arith] of grid) {
        cs.add(arith.eq(0).eq(puzzle.shaded.has(p)));
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of loop.directionSets[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Simple Loop",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb5swFH3nV0x+9gMfyZb4reuavWTd2mSqKoQiJ3EbVIg7A+vkKP+9916YiIFKfdnWh8nhcDi+4ONwD8WPShrFxzCiCfd5ACMMJ3SMfPz9Hsu0zJR4x8+qcqcNEM6/zmb8TmaF8uKmKvEOdirsFbefRcwCxlkIR8ASbq/EwX4RdsHtAqYYD0Cb10Uh0IuW3tA8svNaDHzglw0Hegt0k5pNplbzWvkmYrvkDNf5SHcjZbn+qVjjA683Ol+nKKxlCZspduljM1NUW/1QNbVBcuT27GW7UWsXaW0X2YBd3MUftjtNjkf426/B8ErE6P17SyctXYgDC0dMBJxFUzqNJ3CCmUtxAAwIbwlnhCHhEm7nNiL8ROgTjgnnVHNBeEN4TjgifE81H9DAKy3+NTtxWHc7jvHrWOLFbFGZO7lRDDqdFTpbFc21oCDAqwFtX+VrZRwp0/oxS/duXXq/10YNTqGotvdD9Wtttp2nP8ksc4Q61o5Ud6AjlQba6+RaGqOfHCWX5c4RTlrReZLal66BUroW5YPsrJa3ez567BejI47gMxL9/4z8o88IvgL/rSX1rdmh7tVmMPogD6Qf1MGUN3ov6KD3Io0L9lMN6kCwQe1mG6R+vEHsJRy0F0KOT+3mHF11o45L9dKOS50GPk68Zw==",
            answer: "m=edit&p=7VTLbtswELzrKwqe9yCSoi3plqZxL+4jtYsgEAxDtpVYiGylejSFDP17lkv5IUsBcmmTQ0FrNRwuuSOaw/xXGWYRKGzSBRs4NiFcehxb//ZtGhdJ5H+Ai7JYpxkCgG+jEdyFSR5ZQZM1s3aV51fXUH32A8YZMIEPZzOorv1d9cWvJlBNcIgBR25skgTCqyO8oXGNLg3JbcRfG4zwFuEyzpZJNB8b5rsfVFNgus5Hmq0h26S/I9bo0P1lulnEmliEBX5Mvo4fm5G8XKUPJduXqKG6eFmuPMqVB7myX674+3K9WV3jtv9AwXM/0Np/HqF7hBN/x4TDfA5MevRSLr5qrXWHkVO8pTiiKChOcTpUkuInijZFRXFMOVcUbyheUnQoDihnqAWgxNM1BvvZTNggOPMlEPIM4iBtgwQIuUeyyZMghUEeHltC0t6PSswzM6QEx+Th2XaGhPSh5gdkqjkclKnmCFDN6BDUwCD3kOeCMqsoG5ThFIeBmasGh1HPcIeNOd1gs3mTk802G6w3r7YCYTyom3odmlkBm5TZXbiMGPqP5Wkyz5u+T/YE4rblZhFlLSpJ08ck3rbz4vttmkW9Q5qMVvd9+Ys0W52t/hQmSYvI6bJpUcYXLarI4lY/zLL0qcVswmLdIk4M0lop2hZtAUXYlhg+hGfVNsdvri32h9ETSLzc5P/L7Y0uN/0X2K+84v7hdfa+5NDpTbNe6yPd435ke13e8B2jI9+xtC7YdTWyPcZG9tzbSHXtjWTH4ci9YHK96rnPtapzq+tSHbfrUqeGD2bWMw==",
        },
    ],
});
