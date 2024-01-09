import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Iff, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board, and draw a single loop that goes through all remaining cells
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);
    const shadedGrid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    for (const [p, arith] of grid) {
        cs.add(Implies(shadedGrid.get(p).eq(1), arith.eq(0)));
    }

    // Shaded cells cannot be orthogonally adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(shadedGrid.get(p).eq(0), shadedGrid.get(q).eq(0)));
    }

    // Cells with numbers or question marks cannot be shaded, and are not part of the loop
    for (const [p, arith] of grid) {
        cs.add(Iff(puzzle.texts.has(p), And(shadedGrid.get(p).eq(0), arith.eq(0))));
    }

    // A number indicates the amount of shaded cells in the (up to) four orthogonally adjacent cells
    for (const [p, text] of puzzle.texts) {
        if (text !== "?") {
            cs.add(Sum(...puzzle.points.edgeSharingPoints(p).map(p => shadedGrid.get(p).eq(1))).eq(parseInt(text)));
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
    name: "Koburin",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5swGL3zV1Q++8CPpEu5TF3X7JKxdclUVQhFTkIbVIg7A+vkKP97v+8zETEwaTts62FyeHo8f9jPsZ/Lb7VQKR9DCybc5R4035/QM3Lxd2yLrMrT8Ixf1tVWKiCcf5pO+b3Iy9SJm6rE2euLUN9w/SGMmcc48+HxWML1TbjXH0MdcT2HLsY90GamyAd63dJb6kd2ZUTPBR41HOgd0HWm1nm6nBnlcxjrBWc4zzv6Gikr5PeUNT7wfS2LVYbCSlSwmHKbPTU9Zb2Rj3VT6yUHri+N3fmA3aC1i9TYRTZgF1fxh+1eJIcD/O1fwPAyjNH715ZOWjoP94BRuGe+i5/Cznhmb1gQdIQRVeBajsIEhbdHAQbyaLg7wimhT7iA2bgOCN8TuoRjwhnVXBPeEl4RjgjPqeYN+v2tFf0FO7FvwoFt/GsscWIW1cUqVWeRVIXIGcSDlTJflrW6F2vYbEoP7CdoO6q0pFzKpzzb2XXZw06qdLALxXTzMFS/kmrTGf1Z5LklmLvAksyxtaRKwZk8eRdKyWdLKUS1tYST82uNlO4q20AlbIviUXRmK9o1Hxz2g9ETB3D3BP/vnn909+AWuK8tr6/NDp1eqQajD/JA+kEdTHmj94IOei/SOGE/1aAOBBvUbrZB6scbxF7CQftJyHHUbs7RVTfqOFUv7TjVaeDjxHkB",
            answer: "m=edit&p=7VRNb9pAEL37V0R7noO9y4LxpUrT0AulTaGKIgshQ5xgxWZTfzSVkf97ZmdtwNiV2kM/DtXi0ePt7Mzbtd9mX4sgDUHiEC7Y4ODg3KVnYOtfMxZRHofeBVwW+ValCAA+TibwEMRZaPl11tLal2OvvIHyveczhwHj+DhsCeWNty8/eOUMyjlOMXCQm5okjvD6CG9pXqMrQzo24lmNEd4h3ETpJg5XU8N88vxyAUz3eUurNWSJ+hayWof+v1HJOtLEOshxM9k2eq5nsuJePRWsaVFBeWnkznvkiqNccZAr+uXy3y93vKwqPPbPKHjl+Vr7lyN0j3Du7Suta8+4rZfim3HMu2FCnBEDuzmLhnA18aYhsJBD5e4oTihyigvsBqWg+I6iTVFSnFLONcVbilcUBxSHlDPSenFHpzWGzWrGOXCUK0Aj4RgkQHBCwm44jcYGcRjUnHvg8PMeERo4IG2DRiCHhKQN0qyQDgzNrByCNCsk5rkGuSBNPTk2eYfNzSiaQzIHMD85MHNI+gAqy+fGdnrIn0NLy2ezIlmH6cVMpUkQMzQey1S8yor0IdjgZ0S+BOJ2lNmiYqWe42jXzosedyoNe6c0Gd4/9uWvVXp/Vv0liOMWkdEt06KMIVpUnkat/0GaqpcWkwT5tkWcOKNVKdzlbQF50JYYPAVn3ZLjniuLfWf0+AJvNfH/VvtLt5p+BfYv3W1/5GL6t+TQ16vSXusj3eN+ZHtdXvMdoyPfsbRu2HU1sj3GRvbc20h17Y1kx+HI/cDkuuq5z7Wqc6vrVh2361anhveX1is=",
        },
    ],
});
