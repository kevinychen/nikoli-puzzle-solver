import { Constraints, Context, PointSet, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form blocks
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // All regions contain exactly one block, which is an orthogonally connected group of shaded cells
    const regions = puzzle.regions();
    for (const region of regions) {
        cs.addAllConnected(new PointSet(puzzle.lattice, region), p => grid.get(p).eq(1));
        cs.add(Or(...region.map(p => grid.get(p).eq(1))));
    }

    // A number indicates the size of the block in the region
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...regions.get(p).map(p => grid.get(p))).eq(parseInt(text)));
    }

    // Shaded cells cannot be adjacent across region borders
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
        }
    }

    // If all of the blocks were to fall straight down without changing shape, they must completely
    // fill the bottom half of the grid
    const numBlocks = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p, arith] of grid) {
        cs.add(numBlocks.get(p).eq(arith.add(numBlocks.get(p.translate(Vector.S)) || 0)));
        if (p.y === 0) {
            cs.add(numBlocks.get(p).eq(puzzle.height / 2));
        }
    }
    for (const [p, q] of puzzle.points.edges()) {
        if (p.y === q.y) {
            cs.add(Implies(And(grid.get(p).eq(1), grid.get(q).eq(1)), numBlocks.get(p).eq(numBlocks.get(q))));
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
    name: "Stostone",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZdT+M4FH3vr0B59kNs5/uNYcq+MN1lYIVQVKG0BKhIGyZtl1Gq/nfOtW9okmY1Wo1Gy0qrNvbJyf04tnPtrL9tsyoX0qW/jgR6/DwZmUtFgblc/l0vNkWenIjT7eaprACE+P38XDxkxTofpWw1He3qOKkvRf1bkjrSEY7CJZ2pqC+TXf0lqceivsIjR0hwF9ZIAY4P8MY8J3RmSekCTxgD3gLOF9W8yO8uLPNHktbXwqE8n4w3QWdZ/pU7rIPu5+VytiBilm0wmPXT4oWfrLf35fOWbeV0L+pTK/dqQK4+yCVo5RIakEuj+MVy4+l+j2n/CsF3SUra/zzA6ACvkh3aSbJztE+uHrTYtXF8SYRuERER4YEIVc8lDHouUsY9H6mME96Ad8Y3Xm0mcDsMFEqj89a056ZVpr3GMEStTfvZtK5pfdNeGJsxRqekFkqFTqLw9qlQKA+jI+y5B6xjYKQm7MPe9xh7wJgeg31gCDYYxRCyfYg4IcfxEb+NaeJMLorDWFNeji8RRzd5UWQ+Js1g6KGpML6wabBW8GUNhLVmDM2aYyrEbzD5ejx2j8be6EGuAMtBOECcgOMENBb2DaE5YvuINgDWFsVCu9YePbC1Rw9s58rw0uZFD2zjoBda27zoheaxoAdmnRF0vueFr2vnU7vYldpYcl6JvIrjK8RXVid6xGSdHvTwnKMHZp2eLzTPufH1WJsnu5jfAY13Bvesn+LbddEKcXQTh/SwPWHN2jTGwljFeJdiXscYY5cch3Ze1cwn4rd5yXkl9DTxCUtexxj6W1jFvF4xrVfzrkqsL9uEWPeINUTQ08bGFwV0Y8rozLSeaQNTXiHtIf9ol/n5Sv6hnBSVRUdW9+f/97jpKHXG94/5yaSsllmBXX6yXc7yqrnHseqsy+Juva0esjkOCXPq4hwAtzKWHaooy5diseraLR5XZZUPPiIyR/oB+1lZ3feiv2ZF0SHsd0SHssddh9pUOMta91lVla8dZpltnjpE69zrRMpXm66ATdaVmD1nvWzLw5j3I+e7Y65U45tF///N8i99s9ASuB9tT/locszbW1aDpQ96oPrBDlY580eFDv6opCnhcVWDHShssP3aBnVc3iCPKhzc3xQ5Re3XOanqlzqlOqp2StUu+HQ6egM=",
            answer: "m=edit&p=7VZNb9tGEL3rVwQ874GzX+Tqlg+7F9dtahdBIAgGbTOxEMpMKakpaOi/d2ZnaGopFWhQFG2AQOLO4+PszNtdznI3v+2qrlaQ09+UCi3+LJTx0qWPVy6/69W2qecv1Mvd9qHtECj10/m5+lA1m3q2EK/l7KkP8/6t6n+YLzLIVKbxgmyp+rfzp/7HeX+m+it8lClA7oKdNMKzEb6Lzwm9ZhJyxJeCEb5HeLfq7pr65oKZn+eL/lpllOdV7E0wW7e/15nooPu7dn27IuK22uJgNg+rz/Jks7tvP+2yIcVe9S9Z7tUJuWaUa57lmtNy9b8vNyz3e5z2X1DwzXxB2n8dYTnCq/nTnnQ9ZcZRV4taeG0yB0SYA6IkohiJQk+6FH7SBSBM+oCOnfQB4/yU8XnCoEKIOt/H9jy2OrbXOAzVm9i+iW0eWxfbi+hzhqPTYJTWRTbX+PbpQmkLjG0+YhMQ54wd+jsr2CJ2gh1iLxiLoRD/AuMUEscVKaaJi7nsiA3llfiAccyQF4vMBcGoxwtv/YiNxr5+xMYIRs1GYup8xNTXytgtjX3Qg7m8Zuwxjpc4nsYifQvUXIp/SRuAaCuDMjn7o0VsBVvEbuSB86JFXAoulTGcF60yMha0iEVnWRzkxb45SMw8xSB5AfNqia8xvg6CUacVnRb1yJyjRSw6rVPGhbGvFW0WUuwGf8wr74wxFD+XvhjHDHFIjxuxEW2meMY64LsUZB0Djh0kDu28epjPkPIgeQHG+IRB1jGUCdZB1ivQeg3vKuD6ik+haUOXeXYpjn33tJlRGb2OrY2tj+VV0B6Cu8xh+fm08HhzeS5gLs4r2m5QC5B2No6NZ1NEQ0tFhkkrZBmN4+5OszFsQjSen3kO7dnFc/dCDHuW7FlyhpKflZwhcPfAIgILhFyLHe7ZGcCKLcQKr3OxINaIZQEg4wcjcY3EkQkBmQqw8twKL9MAVuLIfIATfyfPZS4gTsbzDsq7Ji3rfrYw/IlPf+7b45azRXZ2/7F+cdl266rBr+Llbn1bd8M9HkOyTdvcbHbdh+oOP6rxlKIi9xg9E6pp28/N6jH1W318bLv65CMia0x/wv+27e4n0b9UTZMQm3juSig+HiTUtlsl91XXtV8SZl1tHxLi4JyQRKoft6mAbZVKrD5Vk2zrccz7WfZHFq+FwTOe+X7G+4/OeLQE+Ved9P75aepvfBL+X3Li29t2J0sf6RPVj+zJKhf+qNCRPyppSnhc1cieKGxkp7WN1HF5I3lU4cj9RZFT1Gmdk6ppqVOqo2qnVIcFv1jO/gQ=",
        },
    ],
});
