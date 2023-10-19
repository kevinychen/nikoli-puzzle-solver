import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a loop that goes through every cell
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);
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

    // A number indicates the length of the longest visit to that region
    const regions = puzzle.regions();
    for (const [[p], text] of puzzle.edgeTexts) {
        const number = parseInt(text);
        const region = regions.get(p);
        let maxLength = new ValueMap(region, _ => cs.int(0, 1));
        cs.add(...region.map(q => maxLength.get(q).eq(1)));
        for (let i = 0; i < number; i++) {
            if (i === number - 1) {
                cs.add(Or(...region.map(p => maxLength.get(p).eq(1))));
            }
            const newMaxLength = new ValueMap(region, _ => cs.int(0, 1));
            for (const q of region) {
                cs.add(
                    newMaxLength.get(q).eq(1).eq(
                        Or(
                            ...puzzle.points
                                .edgeSharingNeighbors(q)
                                .filter(([p]) => region.some(q => q.eq(p)))
                                .map(([p, v]) => And(loopDirection.get(q).is(v), maxLength.get(p).eq(1)))
                        )
                    )
                );
            }
            maxLength = newMaxLength;
            if (i === number - 1) {
                cs.add(...region.map(p => maxLength.get(p).eq(0)));
            }
        }
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
    name: "Maxi Loop",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRfT9s+FH3vp0B+9kMdJ6bkjR8re2HdGEwIRRFKS4CItGZuOn5K1e/O8Y1D/jTTJKZpPExRro5PbnyP7Xu8/r5JTMoVHjnhYy7weErRK3yf3rF7LrMiT8MDfrwpHrQB4Pzz6Sm/S/J1OopcVjzalkdhec7Lj2HEBOPMwytYzMvzcFt+CsspLy/wiXEB7qxK8gCnDbyi7xadVKQYA8+AZfXbNeAiM4s8vTmrmC9hVF5yZuv8R39byJb6R8qcDjte6OU8s8Q8KbCY9UP25L6sN7f6ceNyRbzj5XEl92JArmzkWljJtagv163nD8s9inc7bPtXCL4JI6v9WwMnDbwIt4gziiLcMn8ysTMoksSUUHaE46JR4LU345p+OqXoUbzEnLyUFD9QHFMMKJ5RzhRFhAi48AIWemgDDx31iiWw32ApKyy9FkY/SgghTN1YYR/5bRy4/MBixwfID1ytABqUw8piLJV4dHmNfeDAYWm7v8bIlzXGnLKeEzpf6wIrp1NZ7HgFPYd1Dv5VTpsCPrQYm3RFW3VC0aeoaAsP7aG94Vh/57R+KSfysLrXBzvzVhyPIja9vU8PZtoskxxtPdss56mpx7hH2FrnN+uNuUsWcAVdM2h8cCvK7FC51k95turmZfcrbdLBT5ZMUX4gf67NbW/25yTPO0R1bXaoyt8dqjAwb2ucGKOfO8wyKR46RMvonZnSVdEVUCRdiclj0qu2bNa8G7H/Gb2RxCUt/13Sf+mStkcwfm+efm9yqHu1GbQ+6AH3gx10ueP3jA5+z9K24L6rwQ4YG2zf26D27Q1yz+HgfmJyO2vf51ZV3+q21J7bbam24aN49AI=",
            answer: "m=edit&p=7VVNT9tAEL3nV6A9zyHez+AbpaEXSkuhqpAVIScYiHBi6iSlMvJ/78zOBtuJK1VUVXuoLK/ePs/H8+zO7urrJi0zsPioEQwhwkda699Ia/8Ow3M5X+dZfABHm/V9USIA+HByArdpvsoGSbCaDJ6rw7g6h+pdnIhIgJD4RmIC1Xn8XL2PqzFUF/hJQITcKRtJhOMGfvHfCR0zGQ0RnyFW7HaFcDYvZ3l2fcrMxzipLkFQnjfem6BYFN8yEXTQfFYspnMipukaf2Z1P38MX1abm+JhE2yjSQ3VEcu96JGrGrnqRa7qkRv+5w/LPZzUNZb9Ewq+jhPS/rmBowZexM816aIxip+FHo0ogvWShI0szWSYGdkuxpV3OvGj9OMlxoRK+fGtH4d+NH489TZjTBJFBiJpRCxxG0jdwgqxbrBSjJVsYdyPSgbsdyNjrbrYBHtDOPAG7U3IZVCDDdgStoG3DdaITcCKdv8Wo72yjQa1jSlbeRHboNMSDrxFPU41emzQZhE7wjXtHirVsR+1H60voaNFw2Vtl9huiyukBImBFRCiEhFSQAUlpIHKTMhgLzPCrnaMHChGWGvFUZQCxb74j4p98c91QPbFw4LmeFqCVltkWAGuheYoeG6YgAwYjoIV1hxFOzCMsHKGo+Da2YA0WPbFdbPsiyu19cDDihVgpYMHIscKsLLBA08wyx7WgWPk0I49nALHOZwGxx7OgOPIzrIH7+F209Tbfc7NdNXqBVrIepDgekQvj3k9ngwSMb65yw7OinKR5tj4Z5vFNCu3czxpxarIr1eb8jad4bnhD2Lw3NJbdqi8KB7z+bJrN79bFmXW+4nIDNP32E+L8mYn+lOa5x1i5S+WDsUnYIdal/POPC3L4qnDLNL1fYdoHYWdSNly3RWwTrsS04d0J9ui+ed6IL4L/yYKrzH1/xr7S9cYLcHwFZfZ79xRv3AI/1ty/O4tyt7WR7qn+5Ht7fLA7zU68nstTQn3uxrZnsZGdre3kdpvbyT3Ohy5nzQ5Rd3tc1K12+qUaq/bKVW74ZPJ4Ac=",
        },
    ],
});
