import { Constraints, Context, PointSet, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board according to the numbers
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Clues outside the grid represent the lengths of each of the blocks of consecutive shaded
    // cells in the corresponding row or column, in order from left to right or top to bottom
    // A question mark represents a block of any length (at least 1)
    // An asterisk represents an unknown amount of blocks of any length
    // An asterisk may also be meaningless, i.e. represent no blocks at all
    const texts = new PointSet(puzzle.lattice, [...puzzle.texts.keys()]);
    for (const [line, p, bearing] of puzzle.points.lines()) {
        cs.addContiguousBlockSums(
            line.map(p => grid.get(p)),
            texts
                .lineFrom(p, bearing.negate())
                .map(p => puzzle.texts.get(p))
                .reverse()
        );
    }

    // The shaded cells cannot form a 2x2 square
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Or(...vertex.map(p => grid.get(p).eq(0))));
    }

    // All shaded cells form an orthogonally contiguous area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(1));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Cross the Streams",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVPb5tOEL37U0R7rPbA8vfP5ac0TXpJ3aZOFUXIirBDEivYpBg3FZa/e97MAgZM1VZV1Rx+wqzmvVl23s76wfrrJs4T6eGyfGlIhcsybL5dg371dbko0iQ8kseb4iHLEUj58exM3sXpOhlFJmbgno62ZRCWF7J8H0ZCCSlM3EpMZXkRbssPYTmW5QQpIRW4cz3JRHiqQ99AfMUTiD3RrCJ2XMUIrxHOF/k8TW7ONfMpjMpLKajQW36aQrHMviWiEkJ4ni1nCyJmcYHdrB8WT1VmvbnNHjfVXDXdyfJY650M6LX2einUcikakEu7+Mtyg+luh75/huCbMCLtX/ahvw8n4RbjONwK06dH/4MWfTjCMoh40yI8InB4DcGPtGcEvTXs/hq2IsJqEW7/Ea7SIpx+FZertAivT/hctqU0YIKOoSZYR1MFPVDciWsez3g0ebxEo2Rp8fiOR4NHh8dznnOK/inLkYp24xtY0nalcrATBhYAbUtnPGSwJZ0BsGtg+8hgKzoDYNfADqRysQWdAXBq4MCeLvbCwIVTPbN+BhmnzjjIuHXGgVCnFuq0hboAbgOgza21eQBeA6CNes7AB/AbAG3UawZBIE2jAggAKjmmAlANUACsDZ284n6e8Gjz6HKfPfq7/tYf+s+P9KdyIjqx6kJ/fiWajiJxenufHI2zfBmnsO54s5wleY3xshTrLL1Zb/K7eA7n87sU5ga34pkdKs2yp3Sx6s5b3K+yPBlMEZmg/MD8WZbf9lZ/jtO0Q+gvQ4fS77AOVeR4QbVwnOfZc4dZxsVDh2i9zDorJauiK6CIuxLjx7hXbbnf824kvgu+IwvfIuv/L9G/+hLRGRivzb6vTQ7/fbN80PugB+wPdtDmFX/gdPAHnqaCh7YGO+BssH1zgzr0N8gDi4P7gctp1b7RSVXf61TqwO5Uqu34aDp6AQ==",
            answer: "m=edit&p=7VVNb5wwEL3vr4h8rHzAfMOlStOkl3TbNKmqCK0idkMSFHZJgW0qVvz3vrExCyyVUlVVe6gAe94bfzzGHrv8uo2LhHt4LJ8bXOCxDFt+rkGvfq7SKkvCI368rR7yAgbnH87O+F2clcksMtEC32K2q4OwvuD1uzBignFm4hNsweuLcFe/D+s5ry/hYlyAO1eNTJinyvQN2F9kA2JPFCuInbc2zGuYq7RYZcnNuWI+hlF9xRlN9Eb2JpOt828Ja4UQXuXrZUrEMq7wN+VD+tR6yu1t/rhleoqG18dK7+WEXmuv1+rkWtNyzT8vN1g0DeL+CYJvwoi0f96b/t68DHcN6dox06eur6FFLQ6zDCJe9QiPCLNH+OMWwWgMezyGLYiweoQ77uKNCGc8ixuMCG9M+MZIaWDoZdSEGMyCGAgZiWtZnsnSlOUVAsVrS5ZvZWnI0pHluWxzivgJy+GC/sY3MKTtcuF4LbAAbA1sDx5fewBsDWwfnkB7AGwN7IAL19AeAEcDB+npiha4yFTP1H3gcbTHgcfVHgdCHS3U6Qt1AdwOQJurtXkAXgegzdPafAC/A9AWaG1BwE2jBTAAWjmmABAdEABSW0N5Q/E8kaUtS1fG2aPtig3dXwd3uAJqH3crqVYJ+5tRGLHMFAxUFEeqWmSqypKVp0jPlpWvkK+a+C3pyCpQZKDIgMhu96gdQ3/SzCJa1PbxXmYtZhE7vb1PjuZ5sY4zZPd8u14mhcY4T1mZZzfltriLVzgc5HHLJbeRLQdUludPWboZtkvvN3mRTLqITDD9RPtlXtyORn+Os2xAlPLyGFDqmBtQVZEOcFwU+fOAWcfVw4DonXeDkZJNNRRQxUOJ8WM8mm29/+dmxr4z+UUWrivr/2X1ty4rWgPjl66s3z+0X3Dg/Fty5PbNi8ncBz2R/mAn07zlDzId/EFO04SHaQ12IrPBjpMb1GF+gzxIcXA/yXIadZzopGqc6zTVQbrTVP2MjxazHw==",
        },
    ],
});
