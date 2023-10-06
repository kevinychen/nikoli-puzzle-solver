import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // A group of orthogonally connected shaded cells is called a block
    // Each block must be a filled rectangle or square
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Sum(...vertex.map(p => grid.get(p).eq(0))).neq(1));
    }

    // Numbered regions must contain the indicated amount of shaded cells
    const regions = puzzle.regions();
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...regions.get(p).map(p => grid.get(p))).eq(parseInt(text)));
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
    name: "Chocona",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZJb9tGFL7rVwQ8z2EW7rc0sXtx1aZ2ERiEYFA2EwuhzJSSmoKG/3u+9/hGXKSiKIqiKVBIGn769OZty2h2vx7KtlJG09ulCk+8QpPyx6Yxf7S8bjb7uspfqdeH/WPTAij14+Wl+lDWu2pRiNRq8dxlefdOdd/nRWACFVh8TLBS3bv8ufsh75aqu8ZPgTLgrnohC3gxwPf8O6E3PWk08FIw4C3g/aa9r6u7q575KS+6GxWQne94N8Fg2/xWBeIHfb9vtusNEetyj2B2j5vP8svu8NB8OoisWb2o7nXv7vUZd93gLsHeXUJn3KUo/mF3s9XLC9L+Mxy+ywvy/ZcBpgO8zp+xLvPnwGnaisqYvjaBs0REIyIkQo+IlIhwIEImKFohojkRu5mVOJlZSdjsyErCZkc6kngmkTIxkjDazLQaPTds9Nw3Y9jSeJfJiHEjxrJ7o5hNn5axTBjNmVnYSLnhxN/yesmr5fUGdVGd4/Utr5rXiNcrlrlAuayxyloEbjFOFlMZon6EXTbgUAMjFYSNgzySzfLJwIdG2QgOE44iZWOETDjGtB8x5GOki2WgJ0LIjMOBJ/kUySGcwrdMfMug84hj5UzvG57K2V4PnspRMxHGmeNcbxdP5SKkzmOJyyHeAUfQ0+t3xgD3sTA24k8GnR6n8DkTn1PEkkos5HPa2+I8ROJzhNwmks8E+fTyBjJW8mMp57I3pPxIniPkLZE8016PSZ7mjetFNRKdIXyjkfF7PSaemoox+SZ2I+hJxG4C/z2OUAuaIx9vKntT7KVhYYwcasmhRi2o+TlvboqlZzjnR5wAS70schv2tvBEvaQWpJPGkDHVwteF6iX1pb0eE298HalPxJaBLSd6HPRIHhxyMsGSK3DgRU8IPbGPkeISnYS1xKix18he/MM5OvbYFmJx0nsko30O0Yd0mAi2mdQxQx0zHy/2HmWgU0stEqqF1DRBn9DRxr2EeoldPFFrqRH8t+I/nsDSPzFmNhb5mOou8gnqe8SwlfieoVn2+qmXxAfCbiQTSl8Z6k/xn/xhjIPnPR8/b3gNeY35WEroz+Qv/d38/RPwT90pMFl0d5m+ov8et1oUwcXDx+rVsmm3ZY2/++Vhu65a/x33q2DX1He7Q/uhvMdtga9fuBCAe2LJCVU3zed68zSV23x8atrq7E9EVjB/Rn7dtA8z7V/Kup4Q/YVyQvX3ngm1b3GpGX0v27b5MmG25f5xQowuQBNN1dN+6sC+nLpYfipn1rZDzC+L4PeAP4XD5dX9f3n9ly6vVAL9rZ0p35o73L1Ne3b0QZ+ZfrBnp1z4k0EHfzLSZPB0qsGeGWyw89kGdTreIE8mHNwfDDlpnc85eTUfdTJ1Mu1kajzwxWrxFQ==",
            answer: "m=edit&p=7Vbfb9s2EH73X1HomQ88/pbfujbZS5atS4ahMIxASdTGqB11sr0OCvy/7448mZLsASuGYRswJOZ9+nS8O97xRG5/2VdtLUDSvw4CJf4ZCPGngos/yX+3q926nr8Sr/e7p6ZFIMT3l5fiQ7Xe1rMFay1nL105796J7tv5ooBCFAp/UCxF927+0n03765Fd4OvCgHIXSUlhfAiw5/je0JvEgkS8TVjhO8RPqzah3V9d5WYH+aL7lYU5OebOJtgsWl+rQuOg54fms39ioj7aoeL2T6tPvOb7f6x+bQvehcH0b1O4d6cCVfncPUxXH0+XPX3h1suDwdM+48Y8N18QbH/lGHI8Gb+cqC4XgotaSpWBlJtCq2IsAPCECEHRCDCZMKEPltM2Cnh9MSL8xMvXk28eDOx4d1EI7iJBkiYWAU5dQxyGhuAmc6Ckhg9YJSarBlSWoY6xk6ZybIx5RAT/z6Ol3FUcbzFuohOx/FtHGUcbRyvos4FlkuBEkrhwhW2k8KuNDJhXWZsJGJIGDTqe9b3mTcglLUJWyuUKxN2YYBR3wXWQTvWMDaZJ/2gEg4YW8mxlXaAndCQYtP0eVHJDkqhdbKDEnHJuBTa6ox5XRrXm7FFO45tAmKbMXA8Zcg4YMwlxxxwLcHkmIPOebAcs8Xces6nl1kfUEdxfhTlnOcayg/n2WLePOS5PSZ93deLasQ2DcZmQ57bY+IN18hQbOzXoh3Pfr3K2GIt/GC9gecGS19vxphDyTmUWAvgWuA+GWHeMzHnR+wRc70U5tYkXyixXi7blMCYatHXhepV5rk9Jh76OtI+YV+AvjTb0WiH86AxJyPMuUIOebZj0I7r16izTcKS1yhxLvBcoL3Ha9G4Fq2zjuxziPtQ6iNWJdexxDqW/XrVQAdtSq6Fp1pwTT3uE9/vJawX+0WJteYaYfyK40eJmPePw551rO+o7qzv7QCjL9/vmZD1Ne2lkLEe6BjeV0D7U+d4Ij7QqUafnzdxNHF08bPk6TDB42b42XLjD1Y6ZY4fvvRRu+FzB9JpQ0InEZIoo6D2gHS6oLCQRHpyabpLpEvTnU3CR+HTdJ9In8iQJlA3oCjTvDKpgPQsk/94METJ78GxDCxZTymWzCvmeY3AiwReJRh+Nv0z+zFs33Achu1YtsMpAMt6lvU4J8BJAc4KcFrAsf2Yn+Pxk44cqu1httDpwjf+s/89bjlbFBePH+tX1027qdZ4R7reb+7rtn/GS2mxbdZ32337oXrAK1a8s4rIPUfNEbVums/r1fNYb/XxuWnrs6+IrNH9Gf37pn2cWP9SrdcjYhtv4SMqXRZH1K5djZ6rtm2+jJhNtXsaEYNb48hS/bwbB7CrxiFWn6qJt01e82FW/FbE30LjjV//f+P/h278VAL5Vff+v34V/RPnwr8rnLh7m/Zs6yN9pvuRPdvlzJ80OvInLU0OT7sa2TONjey0t5E6bW8kTzocuT9ocrI67XOKatrq5Oqk28nVsOEXy9nv",
        },
    ],
});
