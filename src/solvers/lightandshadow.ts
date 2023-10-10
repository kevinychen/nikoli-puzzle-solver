import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({}: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form shaded and unshaded areas
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Each orthogonally connected area contains exactly one clue
    cs.addConnected(
        puzzle.points,
        p => puzzle.texts.has(p),
        (p, q) => grid.get(p).eq(grid.get(q))
    );

    // A clue represents the size of the area of shaded or unshaded cells that the clue belongs to
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(1).eq(puzzle.shaded.has(p)));
        cs.addContiguousArea(puzzle.lattice, puzzle.points, p, q => grid.get(q).eq(grid.get(p)), parseInt(text));
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
    name: "Light and Shadow",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRfb9o+FH3nU1R+9kP+QAd+67qyF8Z+HUxVFUXIQFqiJrhzkl+nIL577702Ck4yqS/b+jCZXB+Ob3yPYx8XPyqpEz6CFo65x31oQTCmZ+jh79SWaZkl4oJfVeVOaQCcf51O+YPMimQQ2ax4cKgnor7l9WcRMZ9xFsDjs5jXt+JQfxH1gtcLGGI8BG5mkgKANw28o3FE14b0PcBziwHeA9ykepMlq5lh/hNRveQM63yktxGyXP2fMKsD/29Uvk6RWMsSFlPs0mc7UlRb9VTZXD8+8vqqJRerWLmo3MpFaOQi6pGLq/jNcifx8Qif/RsIXokItX9v4LiBC3FgQchEyFnoUzcMTDeBDhLmNiHCTfPNtrEABqGM1zD4spOC05iFnwh6Z9gQIyIuTwTU8sUB4j3FKcWA4hK08jqk+ImiR3FEcUY5NxTvKF5THFK8pJwPuNo3fg+z6D8gJwqMtbCN3obiQcQWlX6QmwR2fV7l60RfzJXOZcbAZqxQ2aqw44JcCOcCuD1lOlSm1HOW7t289HGvdNI7hGSyfezLXyu9bc3+IrPMIcyd4lDm+DtUqeFsn/2XWqsXh8lluXOIMx84MyX70hVQSleifJKtanmz5uOA/WT0RCHcYeG/O+wv3WG4Bd57c+57k0OnV+le6wPd435ge11u+Y7Rge9YGgt2XQ1sj7GBbXsbqK69gew4HLhfmBxnbfscVbWtjqU6bsdS54aP4sEr",
            answer: "m=edit&p=7VRRb5swEH7nV1R+9gPgJE1467pmL1m2LpmqCUWRk9AGFeLOwDoR8d97dyYlBib1pdoeJsPd8fns+2zzOftZSB3xITQx5i73oPn+mN6Bi8+pLeM8iYILflXke6Uh4PzLdMrvZZJFTlhnrZxjOQnKW15+CkLmMc58eD224uVtcCw/B+WClwvoYlwANjNJPoQ3TXhH/RhdG9BzIZ7XMYQ/INzGeptE65lBvgZhueQM63yg0RiyVP2KWM0Dv7cq3cQIbGQOi8n28VPdkxU79ViwU4mKl1ctul5DVzR0xStd0U/Xf3+6k1VVwbZ/A8LrIETu35tw3ISL4Mh8wQLBmfDIDXzjJuAqpGwSQjw0zxwb8ydUxm0QHGyl4DRm4SeAxgwaYEjA6ARALS84VrgzaKdkfbJL4MpLQfYjWZfskOyMcm7I3pG9JjsgO6KcS1wt7Mf5HKPO6DlZw8JUOG0PUPQH5IRrnEcOV4nu0rixcRNyQ8x8XY9ZA/KrnNA3msI2fFu0ckK2KPS93EZw3PMi3UT6Yq50KhMG+mKZStZZ3R+Q/DhhB8q0oESppyQ+2Hnxw0HpqLcLwWj30Je/UXrXmv1ZJokFZHSZWJD57y0o17H1LbVWzxaSynxvAWcCsGaKDrlNIJc2RfkoW9XSZs2Vw34zekMBl5f4f3n9pcsLj8B94xXW0u573iD/Fh36e5XulT7APeoHtFflNd4ROuAdSWPBrqoB7RE2oG1tA9SVN4AdhQP2B5HjrG2dI6u21LFUR+1Y6lzw4cp5AQ==",
        },
    ],
});
