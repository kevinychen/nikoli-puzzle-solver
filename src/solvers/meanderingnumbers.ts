import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Distinct, Not }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell to make a path in each region
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    cs.add(...Array.from(grid.values(), arith => arith.ge(1)));

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Within each region, two consecutive numbers must be orthogonally adjacent
    const [_, paths, order] = cs.PathsGrid(puzzle.points);
    for (const [p, q, v] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Not(paths.get(p).hasDirection(v)));
        }
    }
    cs.add(...Array.from(grid, ([p, arith]) => arith.eq(order.get(p).add(1))));

    // Numbers must be between 1 and N, where N is the size of the region
    // Each region contains exactly one of each number
    for (const region of puzzle.regions()) {
        cs.add(Distinct(...region.map(p => order.get(p))));
    }

    // Two equal numbers cannot be horizontally, vertically or diagonally adjacent
    for (const [p] of grid) {
        for (const q of puzzle.points.vertexSharingPoints(p)) {
            cs.add(grid.get(p).neq(grid.get(q)));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        if (!puzzle.texts.has(p)) {
            solution.texts.set(p, model.get(arith).toString());
        }
    }
};

solverRegistry.push({
    name: "Meandering Numbers",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTBbts6ELz7KwKeeSCpuLV1S1O7l9RtGhdBIAgGbSuJEMlMKemlkOF/z3DFwJaloL20L4eC5mI0XHFH9A6LH5W2CR9iBCMuuMRQakTzVLjfy5inZZaEJ/ysKu+NBeD8y3TKb3VWJIPIZ8WDbT0O60tefwojJhlnClOymNeX4bb+HNYTXl9hiXEJ7qJJUoCTPbymdYfOG1IK4JnHgDeAq9SusmRx0TBfw6iec+bqfKC3HWS5+S9hXod7Xpl8mTpiqUt8THGfPvqVolqbh8rnynjH67PX5QZ7uQ42ch3qkeu+4g/LHce7HY79GwQvwshp/76Hoz28CreIM4qS4g3FKUVFcY5UXgcUP1IUFIcULyhnEm6ZVGMugxELFf5dCaxEgxVaSEmP0UxKeayAA5+PHDlusECO8DkCvPDvCuRLj6Xbx+8vUEt6THW9BrQrNAFD4DXJPKd4SvEdyX/vzuEvn9Qv5UTuxPwY/h6KBxGbrO+Sk5mxuc7QE7MqXyb25RkmZIXJFkVlb/UKLUUeRdeA21Bmi8qMeczSTTsvvdsYm/QuOTJB+Z78pbHro92fdJa1iObGaVGNOVpUadH5B8/aWvPUYnJd3reIA5e0dko2ZVtAqdsS9YM+qpbvv3k3YD8ZzSjADRf8u+H+pxvO/QXirbn3rcmh7jW21/qge9wPttflnu8YHXzH0q5g19Vge4wN9tjboLr2BtlxOLhXTO52Pfa5U3VsdVeq43ZX6tDwUTx4Bg==",
            answer: "m=edit&p=7ZVNb5tAEIbv/hXRnvewH2ADtzR1eknTpk5VRciysE0SFGxSwE2FxX/vzLI2u2si5dKPQ4U9Gh5mmXd3Z5bq+y4pU+rDJQPKKIdLiED9PYa/w3Wb1XkandHzXf1YlOBQ+unykt4neZWOYh01H+2bMGpuaPMhigknlAj4czKnzU20bz5GzZQ2M3hEKAd21QUJcKe9+009R++ig5yBf619cO/AXWXlKk8XVx35HMXNLSWY550ajS7ZFD9SonXg/arYLDMEy6SGyVSP2bN+Uu3WxdOOHFK0tDl/Xa7s5cqjXDksV/x+ueG8bWHZv4DgRRSj9q+9G/TuLNq3qAstV/ZO2UtlhbK3EEobqex7ZZmyvrJXKmYa7QkXIeUyIJGA3eXgC9b5AkpIcO1DMQmhfQG+1PEQw8POZxDDdAwDzvRYBvFc+5z372eQizMjr9YA5QqawG9xQ1DmhbKesmMlf4LrACtlTm9sT6xbIILZYG1x/7rqJTgnIMwgAkloAIkgMICnd+gIQgSyB1LlEQZQacYGUFkmBpDukACBZ4DQSeupLL4BuDPEE44wb+KCwNHhhY5Snzlpfe4o9ccumLhDAkepHzpKx8wSdizlrkxnRll3pYy10I5i0Z1sePlv8+ajmEzXD+nZdVFukhwa73q3Wabl4R5OOlIV+aLalffJCvpWHYRUsa2KtFBeFM95trXjsodtUaaDjxCmkH4gflmUa+ftL0meW6BSx7qFuhPIQnWZWfdJWRYvFtkk9aMFjKPIelO6rW0BdWJLTJ4SJ9umn3M7Ij+J+scSPiPy/2fkL31GcAvYH/6YvOHE/rfkqOotysHWBzzQ/UAHu1zzk0YHftLSmPC0q4EONDZQt7cBnbY3wJMOB/ZKk+Nb3T5HVW6rY6qTbsdUZsPH89Ev",
        },
    ],
});
