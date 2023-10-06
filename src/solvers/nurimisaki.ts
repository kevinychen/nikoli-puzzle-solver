import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Iff, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // There cannot be a 2x2 square of all shaded or unshaded cells
    for (const vertex of puzzle.points.vertices()) {
        for (const i of [0, 1]) {
            cs.add(Or(...vertex.map(p => grid.get(p).eq(i))));
        }
    }

    // Circles mark every instance of a cell which is unshaded and orthogonally adjacent to exactly
    // one other unshaded cell
    for (const [p, arith] of grid) {
        cs.add(
            Iff(
                And(arith.eq(0), Sum(...puzzle.points.edgeSharingPoints(p).map(p => grid.get(p).eq(0))).eq(1)),
                puzzle.symbols.has(p)
            )
        );
    }

    // Clues represent the total number of unshaded cells that can be seen in a straight line
    // vertically or horizontally, including itself
    for (const [p, text] of puzzle.texts) {
        cs.addSightLineCount(puzzle.lattice, puzzle.points, p, p => grid.get(p).eq(0), parseInt(text));
    }

    // All unshaded cells on the board form an orthogonally connected area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(0));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Nurimisaki",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wI+lSbl3X7JJl65KpqhCKnMRtUCHODKyTo/zvfe9BBwYmbYdqPUwOTy8f/3hfg7/Ov5dCSz6GFky4yz1ovj+hZ+Ti76UtkyKV4Rm/LIud0pBw/nk65fcizaUT1aNi52guQnPDzccwYh7jzIfHYzE3N+HRfArNnJsFdDHuAZtVg3xIr5v0lvoxu6qg50I+r3NI7yDdJHqTytWsIl/CyCw5wzrvaTamLFM/JKt14P+NytYJgrUoYDP5LjnUPXm5VY9lPdaLT9xcVnIXA3KDRi6mlVzMBuTiLl5Z7kV8OsFr/wqCV2GE2r816aRJF+ER4jw8Mt/FqQFoqb4NC3wEoxaYdMA5TfkFYCGPlrt7WQ64tUfm45o9SpX6FMv1KNXsUCg5pcI+xSVsjZuA4geKLsUxxRmNuaZ4S/GK4ojiOY15hy/nr15fe++vJCfyKydiG/9ZFjsRm5fZWuqzudKZSOGoLHbiIBl4kuUqXeWlvhcbOGFkWThEwPY0w0KpUoc02dvjkoe90nKwC6HcPgyNXyu97az+JNLUAtUFZKHqe1uo0GCE1n+htXqySCaKnQVaprFWkvvCFlAIW6J4FJ1qWbPnk8N+MnqiAC684P+F948uPPwE7lvz7VuTQ6dX6UHrAx5wP9BBl9e8Z3TgPUtjwb6rgQ4YG2jX24D69gbYcziw35gcV+36HFV1rY6lem7HUm3DR7HzDA==",
            answer: "m=edit&p=7VRRb9owEH7Pr6j87IfEBgp569qyF8bWwVRVEUIG0hI1wcxJ1iko/33ncyg48aTuodoeJpPz8fl899nJd/n3UqiY9mHwIfVpAIOxIT49X/+OY54UaRxe0Kuy2EoFDqWfx2P6KNI89qImauEdqlFY3dHqYxiRgFDC4AnIglZ34aH6FFZTWs1gidAAsIkJYuDentx7XNfetQEDH/xp44P7AO46Ues0Xk4M8iWMqjklus4H3K1dkskfMWl46P9rma0SDaxEAYfJt8m+WcnLjXwuybFETasrQ3fmoMtPdPkrXe6my96f7mhR13DtX4HwMow0928nd3hyZ+Gh1rwOhPl6Kwcu5t0QzjTQOwOGLWDgWwAkCjDdwzEd4NYZCWMulLvRoQsdOPJCyTEWZmjncDRacbQ3aH20fbQTjLlFe4/2Gm0P7QBjLvXlwPWd5xh0dk/RmiObCjN9cE5C4Md6ZhrhxAMzmbUeM9OlmUxI34T0BzCZO3w9iqZZexEzStSj/zZv4UVkWmarWF1MpcpECp/KbCv2MQFNklymy7xUj2INXxhKliK2wx0WlEq5T5OdHZc87aSKnUsajDdPrviVVJtW9heRphaQYwOyIPO+LahQifVfKCVfLCQTxdYCzkRjZYp3hU2gEDZF8Sxa1bLTmWuP/CT4RBwaHv/f8P5Sw9OvwP+jtnfes96tjfxbdPDrlcopfYAd6gfUqfIG7wgd8I6kdcGuqgF1CBvQtrYB6sobwI7CAfuNyHXWts41q7bUdamO2nWpc8FHC+8X",
        },
    ],
});
