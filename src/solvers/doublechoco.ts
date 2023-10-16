import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions of any size
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    const isRoot = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    const instance = cs.addConnected(
        puzzle.points,
        p => isRoot.get(p).eq(1),
        (p, q) => grid.get(p).eq(grid.get(q))
    );
    cs.add(...Array.from(grid, ([p, arith]) => arith.eq(instance.get(p))));

    // Each region contains one white and one grey contiguous area
    const isAreaRoot = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    const areaInstance = cs.addConnected(
        puzzle.points,
        p => isAreaRoot.get(p).eq(1),
        (p, q) => puzzle.shaded.has(p) === puzzle.shaded.has(q) && grid.get(p).eq(grid.get(q))
    );
    cs.add(...Array.from(areaInstance, ([p, arith]) => arith.ge(puzzle.points.index(p))));
    for (const [p] of puzzle.shaded) {
        cs.add(grid.get(p).eq(areaInstance.get(p)));
    }
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.shaded.has(p) === puzzle.shaded.has(q)) {
            cs.add(Implies(grid.get(p).eq(grid.get(q)), areaInstance.get(p).eq(areaInstance.get(q))));
        }
    }

    // Both areas must be the same size and shape
    // They can be rotated or mirrored
    const transforms = puzzle.lattice.pointGroup();
    const partners = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));
    const transformIndices = new ValueMap(puzzle.points, _ => cs.choice(transforms));
    for (const [p] of grid) {
        const choices = [];
        for (const [q] of grid) {
            if (puzzle.shaded.has(p) !== puzzle.shaded.has(q)) {
                for (const transform of transforms) {
                    const v = transform(p).directionTo(q);
                    if (!puzzle.lattice.inBasis(v)) {
                        continue;
                    }
                    const inv = [...transforms].find(inv =>
                        puzzle.lattice.edgeSharingPoints(p).every(p => inv(transform(p)).eq(p))
                    );
                    choices.push(
                        And(
                            partners.get(p).is(q),
                            partners.get(q).is(p),
                            transformIndices.get(p).is(transform),
                            transformIndices.get(q).is(inv),
                            grid.get(p).eq(grid.get(q)),
                            ...puzzle.points
                                .edgeSharingPoints(p)
                                .map(newP => [newP, transform(newP).translate(v)])
                                .map(([newP, newQ]) =>
                                    Implies(
                                        areaInstance.get(newP).eq(areaInstance.get(p)),
                                        And(
                                            areaInstance.get(newQ)?.eq(areaInstance.get(q)) || false,
                                            partners.get(newP).is(newQ),
                                            transformIndices.get(newP).is(transform)
                                        )
                                    )
                                )
                        )
                    );
                }
            }
        }
        cs.add(Or(...choices));
    }

    // A number indicates the size of the area the number is placed in
    // A region can contain one or more identical numbers
    for (const [p, text] of puzzle.texts) {
        cs.addContiguousArea(
            puzzle.lattice,
            puzzle.points,
            p,
            q => areaInstance.get(q).eq(areaInstance.get(p)),
            parseInt(text)
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
    name: "Double Choco",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRBb9owFL7zKyqffUgwbcG3riu7MLYOpqqKImTALVET3DnJOgXx3/vesycwyaRdtvUwhbz35fOz/Rn7c/mtVlbzATxiyCMe4zOCDO8oxl/kn3lW5Vqe8au62hgLgPNP4zF/UHmpe4mvSnu7ZiSbW958kAnrM05vzFLe3Mpd81E2U97MoIlxAdwEUMx4H+DNAd5RO6JrR8YR4KnHAO8BrjK7yvVi4pjPMmnmnOE876g3QlaY75q5bvS9MsUyQ2KpKlhMucmefUtZr81T7WvjdM+bKyd39lMuzuLlonIvF6GTi6hDLq7iD8sdpfs9/O1fQPBCJqj96wEOD3AmdyweMilgUyKXYpcuXBpREu5rIFwaQILOU9/ZLdBtKQ2TMHFEwBABIS6RgDPgCBgoljuI9xTHFPsU5yCSN4Lie4oRxXOKE6q5oXhH8ZrigOIF1VziMn/zj3Ar+gtyknjoPMXPu3PaS9istg9qpWFzp3Wx1PZsamyhcgZuYqXJF6Vvl2Q22H7gtlQZULkxz3m2Deuyx62xurMJSb1+7KpfGrs+Gf1F5XlAuKsjoNwpD6jKwhE++lbWmpeAKVS1CYij4x6MpLdVKKBSoUT1pE5mKw5r3vfYD0ZvIuCqEv+vqn90VeEWRG/Np29NDp1eYzutD3SH+4HtdLnnW0YHvmVpnLDtamA7jA3sqbeBatsbyJbDgfuFyXHUU5+jqlOr41Qtt+NUx4ZP0t4r",
            answer: "m=edit&p=7VRNj5swEL3zK1Y++wA4H9i37XbTS5p2m61WFYoikrAbtBBvDXQrIv57x2MSYqBSL6v2UAEzj+exPWP7Of9eRiqmI3hYQF3q6Ye7+HFPv27z3CdFGosrel0We6kAUPppNqOPUZrHTthErZxjxUV1R6sPIiQ+ofh5ZEWrO3GsPopqQaslNBHKgJsD8gj1Ad628AHbNboxpOcCXjQY4DeA20Rt03g9N8xnEVb3lOh53mFvDUkmf8TEdMP/rcw2iSY2UQHF5PvkpWnJy518LslpippW1ybd5Sldr02Xtemyc7psOF3/7dPlq7qGZf8CCa9FqHP/2sKghUtxJF5ABINNcY3zjJsYx9Ex8zdixo3A1boc09kUaLYUhwkJuyB4h2BTYs6BIWAgTxxrvSTaztD6aO8hSVoxtO/RumjHaOcYc4v2Ae0N2hHaCcZMdZmwEJdjTOzeJPBo4GNhgU8DU+J0fELAcbMy+uibOA6caeVTys3yaW00KKCcn3s0iMMJmJ6X7VyzqWd5Ub+pWddTO6EXGPHR8bBfOSFZluox2sZwChZltonV1UKqLEoJyI7kMl3nTbtAVVLkDhhpUamUL2lysOOSp4NU8WCTJuPd01D8RqpdZ/TXKE0tIsc7xqKMHCyqUIn1HyklXy0mi4q9RVzowhopPhR2AkVkpxg9R53Zsrbm2iE/CX4hgzuN/b/T/tKdprfA/cObraO1t7xf/q108PRKNSh9oAfUD+ygyhu+J3Tge5LWE/ZVDeyAsIHtahuovryB7CkcuN+IXI/a1bnOqit1PVVP7XqqS8GHK+cX",
        },
        // {
        //     puzzle: "m=edit&p=7VVLb5tAEL77V0R73gPLy8AtTZNeXPeRVFGEUIQdkqBgb7rGTYXl/555kMJiKvXSNIcKMTP77czON8vOsvm+zU0hI3i8SDpSweP5Lr2uE9PrtM9FWVdFciSPt/W9NmBI+ensTN7m1aaYpK1XNtk1cdIcy+ZDkgpXSHqVyGTzJdk1H5NmLptzmBLSA2wGlhLSBfO0My9pHq0TBpUD9ry1wbwCc1maZVVczxj5nKTNhRSY5x1FoylW+kchOIzGS71alAgs8hqK2dyXj+3MZnujH7atr8r2sjlmurMXupilpYvMW7poMl20RuhiFX+Zbpzt97DtX4HwdZIi92+dGXXmebIT7lQkHnyUiJTnsFKsPFI+gz6Dvs8qIBW4rNgz4LkgJBXyKGxHnCGMSU15bspzEWeI2hFTijgg5rmYM8QtyKsohyeVetFMRyleSSlcCiqdY6UQw1+Dz5/wwNkGyCPsAJ884MC+AFin5YGlpiLogHDogQVbWbBYKwTLTsW0B0CRFhDD1lshuBvWosohl16McmCLLfK0S3aUgq9oR+GO9aJg71SyA3lF8oykS/ICDpFsPJLvSTokA5Iz8jkleUnyhKRPMiSfKR7DPzyo/BFfgU7qhnTrdU/wuuNskopZuS6O5tqs8goa/PTm7tcI7lOx0dX1Zmtu8yXcDnTdwgUA2Hq7WhTGgiqtHytYzALLu7U2xegUggWkG/FfaHMzWP0pryoL4N+HBfE9Z0G1gUusN86N0U8WssrrewvoXXjWSsW6tgnUuU0xf8gH2VZdzfuJ+CnoTT34WXn/f1b/6GeFn8B5azfBW6NDp1eb0dYHeKT7AR3t8hY/aHTAD1oaEx52NaAjjQ3osLcBOmxvAA86HLDfNDmuOuxzZDVsdUx10O2Yqt/waTZ5Bg==",
        //     answer: "",
        // },
    ],
});
