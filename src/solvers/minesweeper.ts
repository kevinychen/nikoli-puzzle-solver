import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Locate the cells containing a mine in the grid
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Numbers indicate the amount of mines in the orthogonally and diagonally adjacent cells.
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...puzzle.points.vertexSharingPoints(p).map(p => grid.get(p))).eq(parseInt(text)));
    }

    // A number cannot contain a mine
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    const model = await cs.solve(grid);

    // Fill in solved mines
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.symbols.set(p, Symbol.BOMB);
        }
    }
};

solverRegistry.push({
    name: "Minesweeper",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wI6Qpt65resnYumSqKoQiJ6ENKsSdgXVylP+97z3IiIFJ22FbD5PD08vHD/tr7K+Lr5VQCfeheRNucwea607oGdn4O7ZFWmZJcMYvq3IrFSScf5xO+YPIisSKmqrY2uuLQN9yfRNEzGGcufA4LOb6NtjrD4EOuZ5DF+MOsFld5EJ63aZ31I/ZVQ0dG/KwySG9h3SdqnWWLGc1+RREesEZzvOO3saU5fJbwhod+H8t81WKYCVKWEyxTZ+bnqLayKeqqXXiA9eXtdz5gFyvlYtpLRezAbm4ij8s9yI+HOCzfwbByyBC7V/adNKm82APMQz2zHWOK633hnkuAv8ETBDA3h3ByO4AvzuGP+6C8+4rNOiPChDjkKR7ilOKLsUFKObao/ieok3RpzijmmuKdxSvKI4ojqnmHNf8W1/lL8iJ3Npg2Pxfy2IrYmGVrxJ1FkqVi4yBxVghs2VRqQexhgNDDoQzAWxHlQbKpHzO0p1Zlz7upEoGuxAmm8eh+pVUm87oLyLLDFDfJwaqj76BSgXn+uS/UEq+GCQX5dYAJx4wRkp2pSmgFKZE8SQ6s+Xtmg8W+87oiTy4v7z/99c/ur9wC+y35te3JodOr1SD1gc84H6ggy5veM/owHuWxgn7rgY6YGygXW8D6tsbYM/hwH5ichy163NU1bU6TtVzO051avgotl4B",
            answer: "m=edit&p=7ZRdb5swFIbv+RWVr30BNuSDu65rdpNl69KpqlAUOQltUAF3BtaJiP++40NSYvCk7WIfF5PD0cnjg8+L4XXxpRIqpgEMPqEu9WAwNsHLd/XvNG6TMo3DC3pZlXupIKH0w2xGH0RaxE50rFo5h3oa1je0fhdGxCOUMLg8sqL1TXio34f1gtZLmCLUAzZvixik1116h/M6u2qh50K+OOaQ3kO6TdQ2jdfzlnwMo/qWEt3nDd6tU5LJrzE56tD/tzLbJBpsRAkPU+yT5+NMUe3kU0VOLRpaX7Zylxa5vJPLX+Vyu1z2++VOV00D2/4JBK/DSGv/3KWTLl2Gh0brOhDmnZ60fTeEMw2CMzDRgHXAd3sg6K8RjPpg3L9lYlSAGA8l3WOcYWQYb0ExrTnGtxhdjAHGOdZcY7zDeIXRxzjCmrF+ZtiV8zVGg7sXGFsVbYflSRFhek98vdf5OpMyxzdHGLdS30a5tZZPbdS3dvPHVmpZ4XXT9IY0TsRaK+sR/Fy2ciKyqLJNrC4WUmUiJWBmUsh0XVTqQWzh00SvU2Q5VhoolfI5TXKzLnnMpYqtUxrGu0db/UaqXW/1F5GmBijw5DJQazIDlSox/gul5ItBMlHuDXDmNmOlOC9NAaUwJYon0euWdc/cOOQbwSvicFLy/yflXzop9Stwf+m8/CMH1b8lB79eqazWB2xxP1Cry498YHTgA0vrhkNXA7UYG2jf24CG9gY4cDiwH5hcr9r3uVbVt7puNXC7bnVu+GjlfAc=",
        },
    ],
});
