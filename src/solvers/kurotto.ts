import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({}: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Cells with circles cannot be shaded
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).eq(0));
    }

    // Numbers indicate the sum of the size of all blocks that share at least one border with the circle
    for (const [p, text] of puzzle.texts) {
        cs.addContiguousArea(puzzle.lattice, puzzle.points, p, p => grid.get(p).eq(1), parseInt(text) + 1);
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Kurotto",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRBb5swFMfv+RSVzz7gkLYJt65rdsmydclURQhFTkIbVIgzA+tElO/e956ZwOAddqjWw0R4vPz8sP82/jv/UUod8xFc/ph7XOA1gSfcE4E/r76WSZHGwQW/KYu90pBw/mU65Y8yzeNBWFdFg1M1Cap7Xn0KQiYYZ0O4BYt4dR+cqs9BteLVApoYF8BmpmgI6V2TPlA7ZrcGCg/yeZ1DuoJ0m+htGq9nhnwNwmrJGY7zgd7GlGXqZ8xqHfh/q7JNgmAjC5hMvk+OdUte7tRzWdeK6MyrGyN34ZDrN3IxNXIxc8jFWbyx3El0PsOyfwPB6yBE7d+bdNyki+AEcR6cmBjjq/BlhPk2bHiFwGuBawR+A3wCOLkajHwLQM+C+l/97h+4NWkzSJ9ix306cVES0aOkpENByJTkDCkuYQV45VP8SNGjeElxRjV3FB8o3lIcUbyimmtcw79a5faKvJGcUIyNYfml+xkNQjYvs02sL+ZKZzKF/bPYy2PMwKgsV+k6L/Wj3MK2Ix/DzgJ2oDcslCp1TJODXZc8HZSOnU0I492Tq36j9K7T+4tMUwuYU8lC5utaqNDgjtZ/qbV6sUgmi70FWk6yeooPhS2gkLZE+Sw7o2XNnM8D9ovRHfpwCvr/T8F/dAriJ/Dem0vfmxzavUo7rQ/Y4X6gTpfXvGd04D1L44B9VwN1GBto19uA+vYG2HM4sD+YHHvt+hxVda2OQ/XcjkO1DR9Gg1c=",
            answer: "m=edit&p=7ZRNc5swEIbv/IqMzjoA8ie3NI17cd2mTifjYTwe2SYxE7BcAU0Hj/97dhccLFAPPWTaQwezWj8I7SuJV9mPQuqI9+ASI+5yD6+xS/fYw59bX/dxnkTBFb8u8p3SkHD+ZTLhjzLJIiesey2dYzkOyjtefgpC5jHOfLg9tuTlXXAsPwflgpdzeMS4B2xadfIhvW3SB3qO2U0FPRfyWZ1DuoB0E+tNEq2mFfkahOU9Z1jnA72NKUvVz4jVOvD/RqXrGMFa5jCZbBcf6idZsVXPBTuXOPHyupI7t8gVjVzxJlfY5frvL3e8PJ1g2b+B4FUQovbvTTpq0nlwPKGuI/NG+CrsjFftDfMHCNwLMEQgGiCG58WpQU8YAEb2aPzFeXzgxqSrIl06tNKxjQprX1LSoiBkQnJ8ivewArwUFD9SdCn2KU6pzy3FB4o3FHsUB9RniGsIq3w5xqDz9oxitRBVhTkuB0wG9PkuNaJPTQ+bar3eBGLxkxN6o8qGvG9vl07IZkW6jvTVTOlUJvBVzHfyEDGwH8tUssoK/Sg38DGROzmxPb1hoESpQxLvzX7x017pyPoIYbR9svVfK71tjf4ik8QAGZ01Bqr2zEC5jo3/Umv1YpBU5jsDXPjDGCna56aAXJoS5bNsVUubOZ8c9ovRHQo428T/s+0vnW24Be4fnXCXp9G7HQX/lhz6epW2Wh+wxf1ArS6vecfowDuWxoJdVwO1GBto29uAuvYG2HE4sN+YHEdt+xxVta2OpTpux1KXhg+Xzis=",
        },
    ],
});
