import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    const stars = [
        ...puzzle.symbols.keys(),
        ...[...puzzle.junctionSymbols.keys()].map(junction => Point.center(...junction)),
    ];
    const roundedStars = stars.map(p => new Point(Math.floor(p.y), Math.floor(p.x)));

    // Every region contains exactly one star
    for (const [i, p] of roundedStars.entries()) {
        cs.add(grid.get(p).eq(i));
    }
    const trees = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                roundedStars.some(q => q.eq(p)),
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
            answer: "m=edit&p=7VRdb5swFH3nV0x+9gO2kxR467puL1m3jkxVhFDkJLRBJSEzsE5E/PdeG6dgcKVp2rQ9TISrk+Pr+2F8bvGt4iLBU3iYh11M4KHUU+/Elb/zs0jLLAne4Muq3OUCAMafbvA9z4rEibRT7JxqP6hvcf0hiBBBGFF4CYpxfRuc6o9BvcR1CEsIE+DmrRMFeN3BO7Uu0VVLEhfwjcYAlwA3qdhkySpsHT8HUb3ASOZ5q3ZLiPb59wTpOuT/Tb5fp5JY8xJ6KXbpUa8U1TZ/rNA5RYPry7bc0FIu68plL+Uye7nULHfeBvqt5fpx08Cxf4GCV0Eka//aQa+DYXBqZF3SEmWXwQlRBmEINs8TUd/GMmpjJ1Z26tlYQomV9q0x6OyV4twxDe28V01RZRfQM66Zsu+UdZWdKjtXPtfK3il7pexE2ZnyuZCnBufajzEzdyPigmBcaIlh5DOAVEGgepgCZhpLn4nGE8DTzp+4Gvs9DP5ExyGkw3Iv0TEJ7WEPsN/5Ux2H+D0MMamOQy8AexpDK1TvBe13GPYyvZdCLta2C1wPQy55OdjggrVnHp4v28t3kWfeOBFtx418pj+HYidC4Y4fEwSTBhV5tioqcc83oBs1iLDiDtV+nQiDyvL8mKUH0y99OOQisS5JMtk+2PzXudgOoj/xLDOIQk1Vg2ovq0GVIjX+cyHyJ4PZ83JnEL1RYERKDqVZQMnNEvkjH2Tbdz03DvqB1BsxGOPs/xj/S2NcfgL3l4f5H5uB/1Y56vbmwip9oC3qB9aqcs2PhA78SNIy4VjVwFqEDexQ20CN5Q3kSOHAvSJyGXWoc1nVUOoy1UjtMlVf8FHsPAM=",
        },
    ],
});
