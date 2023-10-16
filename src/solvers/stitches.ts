import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ Implies, Not, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Add stitches (lines of length one cell) to connect the regions
    const stitches = parseInt(puzzle.parameters["stitches"]);
    const grid = new ValueMap(puzzle.points, p => cs.choice(puzzle.lattice.edgeSharingDirections(p)));
    for (const [p] of grid) {
        for (const [q, v] of puzzle.lattice.edgeSharingNeighbors(p)) {
            cs.add(Implies(grid.get(p).is(v), grid.get(q)?.is(v.negate()) || false));
        }
    }

    // Stitches can only connect different regions
    for (const [p] of grid) {
        for (const [q, v] of puzzle.points.edgeSharingNeighbors(p)) {
            if (!puzzle.borders.has([p, q])) {
                cs.add(Not(grid.get(p).is(v)));
            }
        }
    }

    // Each region is connected with each neighbour region with a given number of stitches
    const regions = puzzle.regions();
    for (const region of regions) {
        const allRegionBorders = new Map(regions.map(region => [region, []]));
        for (const p of region) {
            for (const [q, v] of puzzle.points.edgeSharingNeighbors(p)) {
                if (puzzle.borders.has([p, q])) {
                    allRegionBorders.get(regions.get(q)).push([p, v]);
                }
            }
        }
        for (const regionBorders of allRegionBorders.values()) {
            if (regionBorders.length > 0) {
                cs.add(Sum(...regionBorders.map(([p, v]) => grid.get(p).is(v))).eq(stitches));
            }
        }
    }

    // A number at the edge of the grid indicates how many line end points must be placed in the
    // corresponding row or colum
    for (const [line, p] of puzzle.points.lines()) {
        if (puzzle.texts.has(p)) {
            cs.add(Sum(...line.map(p => grid.get(p).neq(-1))).eq(parseInt(puzzle.texts.get(p))));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved lines
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value !== -1) {
            solution.symbols.set(p, Symbol.VERY_SMALL_WHITE_CIRCLE);
            solution.lines.set([p, p.translate(puzzle.lattice.edgeSharingDirections(p)[value])], true);
        }
    }
};

solverRegistry.push({
    name: "Stitches",
    parameters: "stitches: 2",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VXRbpswFH3PV1R+9gO2SQK8dV27ly5b105VhaKIpLSNSkJHyDoR5d977rVZIGGapm1aHybE5XB8fX2MfczqyzopUhngMoH0pMJlfM239kK+PXddzcssjY7k8bp8yAsAKT+cncm7JFulvVhxb2/c21RhVF3I6l0UCyWk0LiVGMvqItpU76NqJKtLNAmpwJ3bJA14uoPX3E7oxJLKAx45DHgDOJsXsyydnFvmYxRXV1LQOG+4N0GxyL+mwumg91m+mM6JmCYlJrN6mD+5ltX6Nn9cu1w13srq2Mq97JBrdnIJWrmEOuTSLP6y3HC83eKzf4LgSRST9s87GOzgZbRBHEUboYfU1YcWuzbCePXUa0IT0W8QARFYzJoY+ns1Qs5oEEpxVVMzGFyxhBuOZxw1xysolJXh+Jajx7HP8ZxzTiFcDbFDAyMijYqBAYYKxj5w3+E+8MDhgVQkjHAIPnR8iPzQ5YeUgy/CeNjIH2D/W4wnecFh+IKmRlh5wMrlE+9wQHVsPuPA1QyojuvrUV98Z64Dv2k7FzyBrTatkK/cuAr1teur0ZfWiLBBX2O/CZ7AdR3iG1i7HE05rr7pS+3bueMJ7ObrY1zfjUs1fZfvQ9t3TLyrT+eFT/WxUNe8XCccfY4DXsYhbcNf2qi/v2N+Kic2IZ969YW98Kffxr1YnN7ep0ejvFgkGSw8Wi+maVG/48wUqzybrNbFXTLDCcBHKkwObsmZLSrL86dsvmznze+XeZF2NhGZYviO/Gle3O5Vf06yrEXYX0SLsmdZiyoLHFSN96Qo8ucWs0jKhxbRONRaldJl2RZQJm2JyWOyN9piN+dtT3wTfMcGvyTz/4f0j35ItATea3P7a5PDuzcvOq0PusP9YDtd7vgDo4M/sDQNeOhqsB3GBrvvbVCH9gZ54HBwPzA5Vd33OanatzoNdeB2Gqpp+HjcewE=",
            answer: "m=edit&p=7VZNb9swDL3nVxQ662B9+EO+dV27S5etS4ehMILCSd02qBN3TrIODvLfS1JyHScqsGEbtsNgWH5+pkhK4rO0/LrO64IncKmEB1zApbSkWwaG7sBdl7NVWaRH/Hi9uq9qAJx/ODvjt3m5LAaZoN7BeLBpTNpc8OZdmjHBOJNwCzbmzUW6ad6nzZA3I/jEuADu3BpJgKcd/ELfEZ1YUgSAhw4DvAI4ndXTsrg+t8zHNGsuOcM4b6g3QjavvhXM5YHv02o+mSExyVcwmOX97NF9Wa5vqoc1a0NseXNs0x150lVduuolXeVPV/75dM14u4Vp/wQJX6cZ5v65g0kHR+lmi3ltmIyxq4Zc7NowFbRDbwmJRLhDJEjIjoj1ng+T7BFCkFfVMhBcUApX1J5RK6m9hAx5o6h9S21AbUjtOdmcQuIihgpNFEsleEwUYO2wBhw6HAKOHI64wMQQG+CN4w3YG2dv0CZ2ON6xj6D+LYYnasFh0AUODbEIAAtnbzqcoB/T4cT5TNCP6xtgX+n8gN6kHQs8AYeOB3vh4grwL11fCX2V66ugr1IOK8CtH9nH0tlItHH+VciltmOHJ2A3Xg1xtel8amev9Q5G3vnH/4VG/1vUAy7XCbWa2oiWMcYyhELdXeaoXWCmBQ/BgeIMYoQRoVDwyHKh5JG2CL6GhOKI47QiMtwIQknAE4cM6NBCWBghLBQw6QInnTAUgcBItrqsOF6q1FbgqK1YSBCqOeGtkkcjkjLDGfDQod86lH5a+elXfId+OvLSkd935Pcd+53ExksngZ/2Dx5Xy0f7fRu/E+O3FoE/FaoBL+8fPxWKl/evHBXQAf/yS0MtbAeZMrS1tlf0+9/Gg4yd3twVR8Oqnucl7BPD9XxS1O07bMxsWZXXy3V9m09hm6F9mxO3IMseVVbVYzlb9O1md4uqLryfkCwgvMd+UtU3e96f8rLsEUs6h/QoO589alXPeu95XVdPPWaer+57xM7O2fNULFb9BFZ5P8X8Id+LNu/GvB2w74zuTMG5R/0/9fylUw8uQfBTZ59fP4T8wA73b6VD1VvVXukD7VE/sF6VO/5A6MAfSBoDHqoaWI+wgd3XNlCH8gbyQOHAvSJy9Lqvc8xqX+oY6kDtGGpX8Nl48Aw=",
        },
    ],
});
