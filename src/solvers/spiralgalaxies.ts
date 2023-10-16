import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    const stars = [
        ...puzzle.symbols.keys(),
        ...[...puzzle.junctionSymbols.keys()].map(junction => Point.center(...junction)),
    ];
    const starCells = stars.map(p =>
        grid.has(p) ? p : [...puzzle.lattice.cellsWithEdge(p), ...puzzle.lattice.cellsWithVertex(p)][0]
    );

    // Every region contains exactly one star
    for (const [i, p] of starCells.entries()) {
        cs.add(grid.get(p).eq(i));
    }
    const trees = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                starCells.some(q => q.eq(p)),
                ...puzzle.points
                    .edgeSharingPoints(p)
                    .map(q => And(arith.eq(grid.get(q)), trees.get(q).lt(trees.get(p))))
            )
        );
    }

    // Every region must be rotationally symmetric, with a star at the center
    for (const [p, arith] of grid) {
        for (const [i, q] of stars.entries()) {
            const opposite = new Point(2 * q.y - p.y, 2 * q.x - p.x);
            cs.add(Implies(arith.eq(i), grid.get(opposite)?.eq(i) || false));
        }
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
    name: "Spiral Galaxies (Tentaisho)",
    keywords: ["Tentai Show"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTBb9owFMbv/BWTzz7EDnSQW9d1uzC2DqYKRREy4JaoATMnWScj/vc+v2RKnLjSNHVaD5Px08vPD/uzk8/591JoSUfQwjENKIPG+Rj7MLC/X22RFpmM3tDLstgpDQmln2f0TmS5HMR1UTI4mUlkbqj5GMWEEUo4dEYSam6ik/kUmSU1cxgilAGbVkUc0usmvcVxm11VkAWQz+oc0iWkm1RvMrmaV4VfotgsKLHrvMN/25Ts1Q9Jah32eaP269SCtShgL/kuPdYjeblVD2Vdy5IzNZeV3LlHbtjItWkl12YeuVZcS+60muhF5U6S8xmO/SsIXkWx1f6tScdNOo9OEGcYGcZldCI8hGkYLNY+T8InPhpyHx166Wjso4wzL5545+AXz4gL+hi28wE3xTEuYM/UhBjfYwwwjjBOseYa4y3GK4xDjBdY89ae2h+f61+SE/PKobaNfi9LBjGZ78RREjAnyVW2ykt9JzbwqaF34WsCdij3a6kdlCl1zNKDW5feH5SW3iEL5fbeV79WetuZ/VFkmQOqi8hB1ft1UKHBEa1nobV6dMheFDsHtNzjzCQPhSugEK5E8SA6q+2bPZ8H5CfBHodw84X/b75/dPPZVxC8Np++Njn49SrttT5gj/uBel1e857RgfcsbRfsuxqox9hAu94G1Lc3wJ7DgT1jcjtr1+dWVdfqdqme2+1SbcPHyeAJ",
            answer: "m=edit&p=7VRdb5swFH3nV0x+9oM/khR467puL1m3jkxVhKKIJLRBJSEzsE5E/PdeGxNicKWp6rQ9TA43h2P7+tj43PxHGYkYj6FxFxNMoTHmqmdE5K9ts6RIY/8dviyLbSYAYPzlBt9HaR47oR60cI6V51e3uPrkh4gijBg8FC1wdesfq89+NcdVAF0IU+CmzSAG8LqDd6pfoquGpATwjcYA5wDXiVin8TJoBn71w2qGkVznvZotIdplP2Okdcj3dbZbJZJYRQXsJd8mB92Tl5vssUTtEjWuLhu5gUUu7+Tyk1xul8tMudMm0ZvK9RZ1Dcf+DQQv/VBq/95Bt4OBf6ylLhmpinP/iBiHNBSb54mYZ2M5s7EjKzt2bSxl1Ep71hxs8oI4MqRhOx/VppiKM9gzrriKH1QkKo5VnKox1yreqXil4kjFiRpzIU8NzvU8x8ScjSgBwxDYEoc9ELAOYQp7/AThHzDXWPIjjUeAxxp7mFLSpWkxlZh1c1tMISflXZ4WUxewpzHkZGd5ThjyMJ2HXQB2NYa5TM9l5AxDHq7ncuC53i5jHeaQX14O3rtgzZkH7WU7fRd55rUTsqbcyDb+PbRwQhRso0OMoNKgPEuXeSnuozX4RhUirLh9uVvFwqDSLDukyd4clzzsMxFbuyQZbx5s41eZ2PSyP0VpahC5qqoG1VxWgypEYrxHQmRPBrOLiq1BnJUCI1O8L0wBRWRKjB6j3mq7bs+1g34h9YQcyjj/X8b/UhmXn4C8upj/sRr4b8lRtzcTVusDbXE/sFaXa35gdOAHlpYLDl0NrMXYwPa9DdTQ3kAOHA7cCyaXWfs+l6r6VpdLDdwulzo3fLhwngE=",
        },
    ],
});
