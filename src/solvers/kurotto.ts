import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Cells with circles cannot be shaded
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).eq(0));
    }

    // Numbers indicate the sum of the size of all blocks that share at least one border with the circle
    for (const [p, text] of puzzle.texts) {
        cs.addContiguousArea(puzzle.lattice, puzzle.points, p, q => Or(p.eq(q), grid.get(q).eq(1)), parseInt(text) + 1);
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
        {
            name: "Kurotto (cairo)",
            puzzle: "m=edit&p=7ZXPb5swFMfv+Ssmn60JYzCBW9e1u3TdumaqKoQiJ6UtKok7h6wVUf73Pj+YiLF32KROPUyIp8fHBn/94/tYykqr+WO5buSdWsuaRnDxKQ0ogyti4r3g8VQwnsQhjwS0jhFNRXcH/TWrmrrM3tGjbXOvNCSUfjk9pbey3pSTvJjs2jRrL2j7KcsJI5SEcDNS0PYi27Wfs/actpfQRCgDdtZ1CiE9GdIrbDfZcQdZAPl5n0N6Demy0su6nJ915GuWtzNKzDgf8G2TkpX6WZJeh3leqtWiMqCu1uVzDzfbG/Ww7buxYk/bo07ppUcpH5SatFNqMo9SM4HXU5oW+z0s9jfQOs9yI/v7kE6H9DLbQTzPdkTEwa9ZdltChOCGRANJgtSQeCBpKEZvpRz78AOShCPCQsEMEocojQyCA9EhkMVQ3LURxxJohAZrtXrNLkbhDu7UO7ibgotxHi7Gybh4GvswCwNvdxZGUz/HhfFwXJ0Rh8U5xSUKMc5gS2nLMX7EGGCMMZ5hnxOMVxiPMUYYBfZJzKH4o2NzuEuvJCcXwZSmlHMoTiFNrERQxqEA/U1jgeWIbFQ932z1rVyCw7BMgZOArberRaktVCv1aAxnwepurXTpbTKwvLnz9V8ofTP6+pOsawtsfmyltl/uNt9CjYZCcPAstVZPFlnJ5t4CC9lAkd7cV4/2l+A/YAtopC1RPsjRaKthzvsJeSZ45xx+BPx/rf+ntd4sfPDWrPvW5OCZVdpreMAezwP1ervnjr2BO0Y2A7peBuqxM9CxowG5pgbo+BrYb6xtvjp2t1E1NrgZyvG4GerQ5nkxeQE=",
            answer: "m=edit&p=7ZVBb5swFMfv+RSTz9aEbTCBW9e1u3TdunSqqiiKnJQmqCR0hKwVUb57n59JibF32KROO0yIx+NnY/9t/LfnKq/K6WO2rtWiXKuChnCJIQ0ogytk8r0U0VAyEUdchDJ0EU2kuYP2us7rIkvf0ZNtvSwrSCj9cn5O71WxyQbjyWDXJGlzRZtP6ZgwQgmHm5EJba7SXfM5bS5pM4IiQhmwC1OJQ3rWpTdYrrNTA1kA+WWbQ3oL6Tyv5kU2vTDkazpurinR/XzAr3VKVuXPjLQ69Pu8XM1yDYp8nT23cLO9Kx+25ND6njYnRunIo1R0SsWrUuFXyt9UaTLZ72Gyv4HWaTrWsr936bBLR+luryXtiIyCwyjNLyFSCk3CjsRBoknUkYTL3leJwDriiMS8RxiXTCN5jJJQI35AIIuhuFstjsVQCAXWbLWaXYzCHWzUO9gMwcXCXxsH4+Jh5MOMB97qjIdDP8eJ8XCcnR6HyTnHKeIYr+GX0kZg/IgxwBhhvMA6ZxhvMJ5iDDFKrBPrRQHL5rgN6Xx9idH8HNPDSP+iAEYEAmUi8RkHgXmGvH2a8kSY9ySW7dNwxmRiEt62xDiL2iTihwSmgZlF8TpiPZr9YAwCaEKFgD2M09hKJGVC/lnhBHctsimL6WZb3as5GBF3M4psvV3NsspCRVk+al9aMF+syyrzFmmY3S189Wdldddr/UkVhQU2P7aqsj82a8RCdZVb76qqyieLrFS9tMBM1bCXb5b5o90SHBe2gFrZEtWD6vW26sa8H5BngvdYwHkh/h8Jf/VI0BMf/NbBcLwPv9mG82/JwTVbVl7DA/Z4HqjX2y137A3cMbLu0PUyUI+dgfYdDcg1NUDH18B+YW3dat/dWlXf4Lorx+O6q2Obw7b5Ag==",
        },
    ],
});
