import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form clouds
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // All clouds must be rectangular in shape
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Sum(...vertex.map(p => grid.get(p).eq(0))).neq(1));
    }

    // Their width and height is at least two cells
    for (const [p, arith] of grid) {
        cs.add(
            Implies(
                arith.eq(1),
                Or(
                    ...puzzle.points
                        .vertices()
                        .filter(vertex => vertex.some(q => q.eq(p)))
                        .map(vertex => And(...vertex.map(p => grid.get(p).eq(1))))
                )
            )
        );
    }

    // Clouds cannot be diagonally adjacent
    for (const [p] of grid) {
        for (const q of puzzle.points.vertexSharingPoints(p)) {
            if (!puzzle.points.edgeSharingPoints(p).some(r => r.eq(q))) {
                const vertex = puzzle.points
                    .vertices()
                    .find(vertex => vertex.some(r => r.eq(p)) && vertex.some(r => r.eq(q)));
                cs.add(Implies(And(grid.get(p).eq(1), grid.get(q).eq(1)), And(...vertex.map(p => grid.get(p).eq(1)))));
            }
        }
    }

    // The numbers around the grid indicate the number of shaded cells in that row/column
    for (const [line, p] of puzzle.points.lines()) {
        if (puzzle.texts.has(p)) {
            cs.add(Sum(...line.map(p => grid.get(p))).eq(parseInt(puzzle.texts.get(p))));
        }
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
    name: "Clouds",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv+Ssqn33AIT8It65rdsmytclUVQhFTkIbVIg7A+vkKP9733uggYEddtjWSVPip5ePn+2vId+XfS2kjrgQ+HU97nDI+Gg8oSHEkIZTfdZxnkT+Bb8s8oPSkHD+aT7nDzLJokGAa2GEg5OZ+eaGmw9+wATjbAhDsJCbG/9kPvpmyc0KphjUcrMoi4aQXtfpHc1jdlVC4UC+rHJI7yHdxXqXRJtFST77gVlzhue8o9WYslR9i1ilA3/vVLqNEWxlDpfJDvFzNZMVe/VUVLUiPHNzWcpd9ch1a7mYlnIx65GLt/jNcmfh+QyP/RYEb/wAtX+pU69OV/4J4tI/sfEUl05BS/lu2HSIYFQDIahk0iAu1bgNMqIaeME/yJTIuEG8cXtnb9Lex/M6q2ZtMnPa+8yEdTpcTdAF7ynOKQ4pruH+3LgU31N0KI4pLqjmmuIdxSuKI4oTqpniE/ylZ/wH5AQuGLTzAeP+aywcBGxZpNtIXyyVTmXCoI2wTCWbrNAPcgemoC4D/3tgR6q0UKLUcxIf7br48ah01DuFMNo/9tVvld63dn+RSWKBsm9aqLS3hXIN3m38llqrF4ukMj9YoOFza6fomNsCcmlLlE+ydVpa3/k8YN8ZjcCFHu3+79F/qUfjK3DeWhd5a3Lo36t0r/UB97gfaK/LK94xOvCOpfHArquB9hgbaNvbgLr2BthxOLCfmBx3bfscVbWtjkd13I5HNQ0fhINX",
            answer: "m=edit&p=7VVLb9swDL7nVxQ662BZft+6rtkly9YlQ1EYQeAkbmPUiTvbWQcH+e+jKLaxbO+ww17AkIqkPvPxSSql6sshKVMuhPqTAbc4WNxxPRxC2Dgs+s2zOk+jC355qLdFCQbnH8Zjfp/kVTqKVSyMxejYhFFzw5t3UcwE48yGIdiCNzfRsXkfNVPezOATA1/eTLSTDeb12bzF78q60qCwwJ6SDeYdmOusXOfpcqKRj1HczDlTdd5gtDLZrviaMuKh5utit8oUsEpqWEy1zZ7oS3XYFI8H9lLixJtLTXc2QFee6cpXunKYrv3r6YaL0wm2/RMQXkax4v75bAZncxYdT4rXkbm+CvWBiz4b5tsKcM6AEOjitRCJPrKFOOhjtxAfEbeFBG43c+B18wRBLyrsIqHVzRMKozosTeAC71COUdoo57B+3kiUb1FaKF2UE/S5RnmL8gqlg9JDH1/tIOxxO4fXi56i1Cx0BdhypvYNKEqplaOVp5WPyiEVaBWicoVWOtx1tdJxHikd51ta6YBQZwl1FmFZpAPShAvChSTtkNaFhE24TbhNuEO4Q7hLc/dlTn4u1XOpnkdzj+ZEWvgU76v41+PTR6aO4zSKpY0Xk/nz/j1sMYrZ9LBbpeXFtCh3Sc7gumRVkS+rQ3mfrKH58TbliO3R04DyonjKs73plz3sizId/KTAdPMw5L8qyk0n+3OS5wZQ4ftgQPoaM6C6zIx5UpbFs4HsknprAK37zMiU7muTQJ2YFJPHpFNtd17zacS+MRyxhLdI/n+L/tBbpI7A+qkX6bdc3n8XHfzvLcrB1gd4oPsBHexywnuNDnivpVXBflcDOtDYgHZ7G6B+ewPY63DAftDkKmu3zxWrbqurUr1uV6XaDR8vRt8B",
        },
    ],
});
