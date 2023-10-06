import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Implies, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Each shaded cell is orthogonally adjacent to exactly one other shaded cell
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.eq(1), Sum(...puzzle.points.edgeSharingPoints(p).map(p => grid.get(p))).eq(1)));
    }

    // Each outlined region contains exactly 2 shaded cells
    for (const region of puzzle.regions()) {
        cs.add(Sum(...region.map(p => grid.get(p))).eq(2));
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
    name: "Norinori",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRBb5swGL3nV1Q++4BNsgVuXZfskmXrkqmqEIpIQhtUiDsD60SU/973GVeEwLRdtvUwOXx5PH/+/Gz8nH8rIx3zEZo75g4XaFKOzTN06PfSlkmRxv4FvyyLndIAnH+aTvldlObxILBZ4eBQeX51zasPfsAE40ziESzk1bV/qD761YRXC3QxLsDN6iQJOGngjekndFWTwgGeE6YX4FvgTaI3abya1cxnP6iWnNFE78xwgixT32NmhdD7RmXrhIh1VGA1+S55tD15uVUPpc0V4ZFXl7XeRY9et9FLsNZLqKO3XsYfluuFxyP2/QsEr/yAtH9t4LiBC/+AODdRmHhr4tREaeISqbxyTXxvomPiyMSZyZn4B+ZJrFIwX+LrOjg0wrHYa7DAcRKexeCl5SV4acdKjJXSYtSUrsHeCOWHtuQQZWoa/8AvPIY6dqhDcmyOQzmWFyTtBBsJWMKNWciViUMT35gFvqWd+st7+Us5AW2YbdiX30HhIGCT7X18MVc6i1IGX7Jcpau81HfRBofM2BbnCNy+zNaxblGpUo9psm/nJfd7pePeLiJjTNeTv1Z6e1b9KUrTFlFfQi2qtkuLKjS8cPIeaa2eWkwWFbsWceKbVqV4X7QFFFFbYvQQnc2WNWs+DtgPZp7AxaXn/r/0/tWlR9/AeW12fW1yzPFVutf7oHvsD7bX5pbvOB18x9M0YdfWYHucDfbc3KC6/gbZsTi4n7icqp4bnVSde52m6tidpjp1fBAOngE=",
            answer: "m=edit&p=7VRdb5swFH3Pr6j87Adsky7w1nXJXrJuXTpNFUIRSWiDCnFnYJ2I+O+91/ZKDEzqyz4eJsL1yeH6+vjjuPxWJyqlU3jEjHqUwcP5TL++h7+fz01W5Wl4Ri/qai8VAEo/Lhb0LsnLdBLZrHhybIKwuabN+zAijFDC4WUkps11eGw+hM2cNiv4RCgDbmmSOMB5B7/q74guDck8wFeImel3C3ibqW2erpeG+RRGzQ0lONBb3R0hKeT3lFgh+H8ri02GxCapYDblPnu0X8p6Jx9qm8viljYXRu9qRK/o9IoXvWJMr5nGb5YbxG0L6/4ZBK/DCLV/6eCsg6vw2KIujEzHWx0XOnIdbyCVNkLHdzp6Ok51XOqceXgkAYdZMhJy2F0PDg3zLA46zOA4scBi4LnlOfDc9uXQl3OLoSYXGgdTKO/bkj6UEbaMAOx3w3q2q4dybI6HOZZnzMVaQotbhhO51NHX8VxP8A2uFKzl6QKcu1PvLaFZHlhagrUZHHhuGt80gW4EM40wjSF9Q/oz3Uyx+8uemH1Ame0k4saX+Exfh+JJROa7+/TsSqoiyQn4kpQyX5e1uku2cMi0banmDnWxSZVD5VI+5tnBzcvuD1Klo5+QTGG4kfyNVLte9ackzx2i1JeQQxm7OFSlMud/opR8cpgiqfYOceIbp1J6qFwBVeJKTB6S3mhFN+d2Qn4Q/UYCLj3x/9L7W5ce7oH3h6++V9we/5YcfXylGvU+0CP2B3bU5pYfOB34gadxwKGtgR1xNrB9cwM19DeQA4sD9wuXY9W+0VFV3+s41MDuONSp46N48gw=",
        },
    ],
});
