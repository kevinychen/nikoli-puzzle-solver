import { Constraints, Context, Puzzle, Solution, TransformationType, ValueMap } from "../lib";

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
    const transforms = puzzle.lattice.transformationFunctions(TransformationType.ALLOW_ROTATIONS_AND_REFLECTIONS);
    const partners = new ValueMap(puzzle.points, _ => cs.enum(puzzle.points));
    const transformIndices = new ValueMap(puzzle.points, _ => cs.enum(transforms));
    for (const [p] of grid) {
        const choices = [];
        for (const [q] of grid) {
            if (puzzle.shaded.has(p) !== puzzle.shaded.has(q)) {
                for (const transform of transforms) {
                    const inv = [...transforms].find(inv =>
                        puzzle.lattice.edgeSharingDirections().every(v => inv(transform(v)).eq(v))
                    );
                    choices.push(
                        And(
                            partners.get(p).is(q),
                            partners.get(q).is(p),
                            transformIndices.get(p).is(transform),
                            transformIndices.get(q).is(inv),
                            grid.get(p).eq(grid.get(q)),
                            ...puzzle.lattice
                                .edgeSharingDirections()
                                .map(v => [p.translate(v), q.translate(transform(v))])
                                .filter(([newP]) => grid.has(newP))
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
            answer: "m=edit&p=7VRNj5swEL3zK1Y++wBxPoDbdrvpJU27TapVhaKIJOwGLcRbA92KiP/e8QwbMFCpl1V7qIDx43lsz4z9nH0vQhXxMTzC5TZ39OPZ+HmOfu36Wcd5EvlX/LrIj1IB4PzTfM4fwiSLrKD22ljn0vPLO15+8AM2Yhw/h214eeefy49+ueTlCroYF8AtADmMjwDeNvAe+zW6IdKxAS9rDPAbwH2s9km0XRDz2Q/KNWd6nXc4WkOWyh8Ro2H4v5fpLtbELswhmewYP9c9WXGQTwV7XaLi5TWFu3oN12nCFU244hKuGA539PbhepuqgrJ/gYC3fqBj/9pAt4Er/8wcl/kCNsWmxqFmSo2HjaC/saBmDE2l06HBlCBtKU4TMNEivA4hZozOAREwkeOfK10SbedoR2jXECQvBdr3aG20E7QL9LlFe4/2Bu0Y7RR9ZjpNKER7jqk5mrkOd0eY2GzCXUrRHbWQR5XRR5/8POCoVyuCyufNLgj8qGyee0EenIDZpWyXnCmfVSt/ylnnU1mB45L4+GS43VgBWxXqIdxHcAqWRbqL1NVSqjRMGMiOZTLZZnW/j6rkyJ3Q06ASKZ+T+GT6xY8nqaLBLk1Gh8ch/51Uh87sL2GSGESGd4xBkRwMKlex8R8qJV8MJg3zo0G0dGHMFJ1yM4A8NEMMn8LOammTc2Wxnwy/QMCdJv7faX/pTtNbYP/hzdbR2lveL/9WOHh6pRqUPtAD6gd2UOU13xM68D1J6wX7qgZ2QNjAdrUNVF/eQPYUDtxvRK5n7epcR9WVul6qp3a9VFvwwcb6BQ==",
        },
        // {
        //     puzzle: "m=edit&p=7VVLb5tAEL77V0R73gPLy8AtTZNeXPeRVFGEUIQdkqBgb7rGTYXl/555kMJiKvXSNIcKMTP77czON8vOsvm+zU0hI3i8SDpSweP5Lr2uE9PrtM9FWVdFciSPt/W9NmBI+ensTN7m1aaYpK1XNtk1cdIcy+ZDkgpXSHqVyGTzJdk1H5NmLptzmBLSA2wGlhLSBfO0My9pHq0TBpUD9ry1wbwCc1maZVVczxj5nKTNhRSY5x1FoylW+kchOIzGS71alAgs8hqK2dyXj+3MZnujH7atr8r2sjlmurMXupilpYvMW7poMl20RuhiFX+Zbpzt97DtX4HwdZIi92+dGXXmebIT7lQkHnyUiJTnsFKsPFI+gz6Dvs8qIBW4rNgz4LkgJBXyKGxHnCGMSU15bspzEWeI2hFTijgg5rmYM8QtyKsohyeVetFMRyleSSlcCiqdY6UQw1+Dz5/wwNkGyCPsAJ884MC+AFin5YGlpiLogHDogQVbWbBYKwTLTsW0B0CRFhDD1lshuBvWosohl16McmCLLfK0S3aUgq9oR+GO9aJg71SyA3lF8oykS/ICDpFsPJLvSTokA5Iz8jkleUnyhKRPMiSfKR7DPzyo/BFfgU7qhnTrdU/wuuNskopZuS6O5tqs8goa/PTm7tcI7lOx0dX1Zmtu8yXcDnTdwgUA2Hq7WhTGgiqtHytYzALLu7U2xegUggWkG/FfaHMzWP0pryoL4N+HBfE9Z0G1gUusN86N0U8WssrrewvoXXjWSsW6tgnUuU0xf8gH2VZdzfuJ+CnoTT34WXn/f1b/6GeFn8B5azfBW6NDp1eb0dYHeKT7AR3t8hY/aHTAD1oaEx52NaAjjQ3osLcBOmxvAA86HLDfNDmuOuxzZDVsdUx10O2Yqt/waTZ5Bg==",
        //     answer: "m=edit&p=7VZLb5tAEL77V0R73gP7YGG5pWnSi5s+kiqqkBXhhCRWsEmx3VRE/u+dnR17AbtSL2l7qBA73347r4UZluW3ddGUPIVLpTziAi6lJd4ysnhHdF3OVlWZHfHj9eqhbgBw/uHsjN8V1bIc5aQ1Gb20NmuPefsuy5lkHG/BJrz9lL2077P2nLcXsMS4Am4MSDAuAZ4GeIXrDp14UkSAzwkD/ArwZtbcVOX12DMfs7y95MzFeYPWDrJ5/b1k3gznN/V8OnPEtFjBZpYPsydaWa5v68c124bY8PbYpzvepitCuiqkq3bpqsPpytdP1042G3jsnyHh6yx3uX8JMA3wInthMmGZgpeSolCRF8ILhUJ7UntSay9iFLH0wmvGfi02KIyfGZr5CMaiSPxa4tdSHyGlmU8p9QbWr1kfwRLpvYjILwqxlZKkIelcbdyzh53a7dv09ceUHBKoYQKhUUMGwu2zp+G2mrM4EGaoYYZh3WZ7Jin6SDpEOiCsGJhYNXAqIjGwEZEeJI9PqW8l4qGVe2IdK3h2InvZuJJ14xmOEsdLKCLeKhzf4hjhGOM4Rp1THK9wPMFR42hQJ3FlCIXa9WH61kwYy0VCrzd22JchcB0Mn6mEXr1xWBEvAzYKcEx8DJhKJDGAE8Kgk5JOCjqpCfpUlcB1cAqYStGCrdXB1pKONQE7W6pgZyu35Ws1YLPTlxHpWNCh0saP7w5HgP1+QQJWxIOtSIlPOtj5saQDWJIfYQN2/qV/nsAFLBzuxJKadASX9IGAdcDEK9XBsC8Vk47Dhvi4gyFnRR8hDT41xXIHjlZBX291wH9MPjXsMba7Ft8Vqy/Ei07h+mJ1hbgZ5dLguRau+M/OJ6OcjWeL8ui8buZFBZ/w09v73QxOTLasq+vlurkrbuD7jwcqR26xnk/LpkdVdf1UgbMeObtf1E15cMmRJYQ7oD+tm9uB9+eiqnrEEn8QepQ/yXrUqpn15kXT1M89Zl6sHnpE50jreSoXq34Cq6KfYvFYDKLNw543I/aD4Z0r+B1R/39H/tLviHsF0W/+lAy6+TWPnn8rHazeujnY+kAf6H5gD3Y58XuNDvxeS7uA+10N7IHGBnbY20DttzeQex0O3C+a3Hkd9rnLatjqLtRet7tQ3YbPJ6Of",
        // },
    ],
});
