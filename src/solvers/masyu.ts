import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({ And, Implies, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid, root] = cs.SingleLoopGrid(puzzle.points);

    // Optimization: start the loop at a specific circle
    cs.add(root.is([...puzzle.symbols.keys(), ...puzzle.points][0]));

    // The loop goes through every circle
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).neq(0));
    }

    for (const [p, symbol] of puzzle.symbols) {
        if (symbol.isBlack()) {
            // The loop must turn on black circles and travel straight through the cells before and after the circle
            cs.add(Not(grid.get(p).isStraight()));
            for (const [q, v] of puzzle.points.edgeSharingNeighbors(p)) {
                cs.add(Implies(grid.get(p).hasDirection(v), grid.get(q).is([v, v.negate()])));
            }
        } else {
            // The loop must go straight through white circles, and turn in at least one of the cells on either side
            cs.add(
                Or(
                    ...puzzle.lattice
                        .bearings()
                        .map(bearing => bearing.from(p))
                        .map(v => [v, v.negate()])
                        .filter(([v, w]) => grid.has(p.translate(v)) && grid.has(p.translate(w)))
                        .map(([v, w]) =>
                            And(
                                grid.get(p).is([v, w]),
                                Not(And(grid.get(p.translate(v)).is([v, w]), grid.get(p.translate(w)).is([v, w])))
                            )
                        )
                )
            );
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Masyu",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb9owFH3Pr5j87Id8wJrmrevKXli3FqYKRREyYErUBDMnWScj/nvvvckUnGTSNKlaHyaTo8PxxfcY57j4Xgkt+RhGEHKXezB8P6Rn5OLn15inZSajd/yqKndKA+H8y2TCtyIrpBM3VYlzNJeRuePmUxQzj3Hmw+OxhJu76Gg+R2bBzQymGPdAm9ZFPtCblj7QPLLrWvRc4LcNB7oAuk71OpPLaa18jWIz5wz7fKBfI2W5+iFZ4wO/r1W+SlFYiRI2U+zSQzNTVBv1VDW1XnLi5qq2OxuwG7R2kdZ2kQ3YxV28st3L5HSCv/0eDC+jGL1/a2nY0ll0BLwl9AgX0ZH5HizjQ7Nzg2zkD6oXoIZddRz2VVh8Qi18wjk44CYg/EjoEo4Jp1RzQ/hAeE04InxPNRe4h7/e5SvZif06MDjGf8YSJ2aznThIBlFhhcqWRaW3Yg0HT0mCswVtX+UrqS0pU+qQpXu7Ln3cKy0Hp1CUm8eh+pXSm87qzyLLLKG+FyypPl9LKjW8n2ffhdbq2VJyUe4s4exdtlaS+9I2UArbongSnW55u+eTw34yeuIA7qHg/z30j+4hPAL3reX0rdmht1fpweiDPJB+UAdT3ui9oIPeizQ27Kca1IFgg9rNNkj9eIPYSzhovwk5rtrNObrqRh1b9dKOrc4DHyfOCw==",
            answer: "m=edit&p=7VRNj5swEL3zKyqf5wA2Tgi37XbTS/qxTapVhKLISdgNWhJSA92KiP/esR2SGKhUVVq1h8owejyPPc/Gz/m3UsgYODYWgAseNkoD/fquepo2S4o0Dt/ATVlsM4kA4NN4DI8izWMnOmUtnGM1Cqt7qN6HEfEIEIqvRxZQ3YfH6kNYzaGaYhcBD7mJSaII7y7wQfcrdGtIz0X88YQRzhGuE7lO4+XEMJ/DqJoBUXXe6tEKkl32PSYnHep7ne1WiSJWosDF5NvkcOrJy032XJKmRA3VjZE77ZHLLnLZWS7rl0tfX+5oUde47V9Q8DKMlPavFxhc4DQ81kqXip6O8/BIqIfTULAFEp/2skNkgzbLgy6Lk491CarjDBVAxXR8p6OrI9dxonPudHzQ8VZHX8eBzhmqNeAqr+cYNKNxEXhgSchAIeYaRIEygxhQ3yAfmOGYC2xkEAPfjEUDNBwe/qFGygPeGZle32tG+EPgA4NGwE1d7gI3eXwA3MzCMS8wKDC95wVf/w+zKdPm35w3Tm1K7UTU2FM1/nto4URkuhWHmKAxSZ6ly7yUj2KNx0z7FjS3L3erWFpUmmWHNNnbecnTPpNxb5ci481TX/4qk5vW7C8iTS0i17eQRZnTZFGFTKxvIWX2YjE7UWwt4so51kzxvrAFFMKWKJ5Fq9rusubaIT+IfiOGtx77f+v9pVtP/QL3j+++V7uk/i05+vRmstf6SPe4H9lel5/4jtGR71haFey6GtkeYyPb9jZSXXsj2XE4cr8wuZq17XOlqm11VarjdlXq2vDRwvkJ",
        },
        // {
        //     puzzle: "m=edit&p=7VZNb+M2EL37VxAE9kbHkvwRW7fU2fSSbNuNi0VgGAEl05JgSnRJqt4oyH/fIaVu9MEsukCLtkAhazx+Gs48inxDq99KKhnxPfOZzQl8wzVbze0dLBf29pprk2nOQnRH1VNJrkqdChmijcjRWnD+xCRJtT6pcDI5n88XSX4qq4ozdRGLfBJxkUwCL/AnvjfJTYJx9DTWIh/H9djxdELuNS32VO7rCuhjCaNDdC3pGVGksiLh7F2wRoUoxlmhmVQs1oAiLsQJ6ZRqdKJKMQW+FGWSIso5ijMZc7ZHMeNcXaBNyur4vFQaJQIpLWmWpPrrIA0RNhidM52ic5ppAGwWZcpblCJdygJlBYKqnFHIJQqGxKE1PMtzts+oZvwJRewgJJvQA9BGjMbdvH1aOT2ydgmYhkkbcRof21SiEmL784ABkQCKf4ZEO+PFu+AaPjdCIlrCylCdxUgJXupMFChOWXyEl23KGi6vZCOG9rBElmkiGSuaROSnmxtyoFyx0bbZQbvRc7UKqytS/RhucYCJvX28I9Uv4XN1F1YPpLqHR5j4gN2C52MyBfd97QbgfrLPDbiuIz1wP9TPzagHcOsZPd7VyM/httoQbMr8YIcYF+fid4brYfY3bNMoM0BENexzlWan5okq9+JYNrH+7oVUV5ZtM+TblI37LcpmSi3KtzXynZR5VrDPLrar3csLvPSPwPcx3Brqv7669+Ez2A/W+tY+hM94OoWxS0jefod4unShc9+JrgAN+ugicMVeutG5E7105V16rtil4TuIXTljfW/hhp3z8P2ZM9o37Ibw1ExwmGRm3vIQnrsJLhzRsFw3dtECazewpqSaWnttrWft3NpbG/Pe2k/Wrq2dWbv8Y0+8vVe+hryxbf5CNgsbc2mKjbbT+kjqXvP/HrYbbfFa5CehoO1jaIQYWuujKuWBxqBp2ydBu4AVZR4x2YFMszUSx6GWZYNlSQHN/PVJL5ztky5Yx0dC7nvJz3C8dID6T0EHqvddB9ISOk/rN5VSnDsInCBpB2g11k4mVuguAU27FOmR9qrlr3N+GeHP2N6gkGBOFv+fMv/IKWNWwPu+s+ZvaRr/5nZWq15Ip/ABdmgfUKfIG3ygc8AHijYFh6IG1KFrQPvSBmiobgAHAgfsDY2brH2ZG1Z9pZtSA7GbUm29b3cj630B",
        //     answer: "",
        // },
    ],
});
