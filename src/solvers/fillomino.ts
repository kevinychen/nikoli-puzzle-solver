import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, If, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    const instance = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));
    const parent = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));
    const subtreeArea = new ValueMap(puzzle.points, _ => cs.int());
    const area = new ValueMap(puzzle.points, _ => cs.int());
    const tree = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        const neighbors = puzzle.points.edgeSharingPoints(p);
        cs.add(
            Or(
                And(instance.get(p).is(p), parent.get(p).eq(-1), area.get(p).eq(subtreeArea.get(p))),
                ...neighbors.map(q =>
                    And(
                        instance.get(p).eq(instance.get(q)),
                        parent.get(p).is(q),
                        tree.get(q).lt(tree.get(p)),
                        area.get(p).eq(area.get(q))
                    )
                )
            )
        );
        cs.add(
            subtreeArea
                .get(p)
                .eq(Sum(cs.int(1, 1), ...neighbors.map(q => If(parent.get(q).is(p), subtreeArea.get(q), 0))))
        );
    }

    // A number indicates the size of the region, in cells
    // Regions can have any amount of identical numbers, or none at all
    cs.add(...Array.from(grid, ([p, arith]) => arith.eq(area.get(p))));

    // Optimization: region root always has smallest index
    cs.add(...Array.from(instance, ([p, arith]) => arith.ge(puzzle.points.index(p))));

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Two regions of the same size cannot be orthogonally adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Implies(instance.get(p).neq(instance.get(q)), grid.get(p).neq(grid.get(q))));
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
    name: "Fillomino",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb9owFMfv/BWVzz7kB6GQW9eVXRhbB1NVRREykJaoCe6cZJ2M+N/73nNQcJJJ22FbD5PJ0+PjF/vr2F8X3yqhEh5A88fc4S40zxvTM3Twd2rLtMyS8IJfVeVOKkg4/zSd8geRFckgqqviwUFPQn3L9YcwYi7jzIPHZTHXt+FBfwz1nOsFdDHuApuZIg/Smya9o37Mrg10HcjndQ7pPaSbVG2yZDUz5HMY6SVnOM87ehtTlsvvCat14P+NzNcpgrUoYTHFLn2ue4pqK5+qutaNj1xfGbmLHrl+IxdTIxezHrm4ij8sdxIfj/DZv4DgVRih9q9NOm7SRXiAOA8PzBviq7Azrtkb5junpZ+A26oYTlogGCEIzsAlglEDRjSofwIwt0sK7ilOKXoUlyCQa5/ie4oOxYDijGpuKN5RvKY4pDiimktc4m99hL8gJ/KMn7AFv5bFg4jNq3ydqIsZAzOxQmarolIPYgNHg7wGuw9sT0UWyqR8ztK9XZc+7qVKersQJtvHvvq1VNvW6C8iyyxgbg4LmUNuoVLBCT77L5SSLxbJRbmzwNlpt0ZK9qUtoBS2RPEkWrPlzZqPA/aD0RP5cFP5/2+qf3RT4RY4b82qb00OnV6peq0PuMf9QHtdXvOO0YF3LI0Tdl0NtMfYQNveBtS1N8COw4H9xOQ4atvnqKptdZyq43ac6tzwUTx4BQ==",
            answer: "m=edit&p=7VRLj5swEL7zK1Y++4BtSAK37XbTS5p2m1SrFYoikrAbtCRseXQrovz3jscmYKBSe+jjUDlMPj4PM+PHN/mXMswi6sIQE2pTBoPzCT6OLX/1WMZFEvlX9Los9mkGgNIP0yl9DJM8sgLttbJOledXd7R65weEEUo4PIysaHXnn6r3fjWn1QKmCGXAzZQTB3jbwHucl+hGkcwGPNcY4APAbZxtk2g9U8xHP6iWlMg8b/BrCckh/RoRXYd836aHTSyJTVjAYvJ9/KJn8nKXPpekTnGm1bUqdzFQrmjKFZdyxXC5/PeX663OZ9j2T1Dw2g9k7Z8bOGngwj+dZV0nwh35KZwMU2dDhF0vvSZYx8PxOoQ7koTbIsaSGDXECIOKmoDcDCt4QDtFy9EuoUBaCbRv0dpoXbQz9LlFe4/2Bq2DdoQ+Y7lE2IR2jJH5NWE2XG6bE19Q4okGOgAFQvgH7CjavUBme5QxW2PWYAZ6YUzzvMFM+vAm5AVDKqZTMcnr+Azicx2TQ0xex+EtDP6ct/wn2n8C2NMYeFHHYS0McQRr/MVYYQE+jvRR9+JyQmr3F63TUickd/9sBVy1CTncn0MrKyDz8rCJsqsZgR5B8jRZ52X2GG7hxmMLocgd0cmgkjR9SeKj6Rc/HdMsGpySZLR7GvLfpNmuE/01TBKDyLEhGpTSrkEVWWy8h1mWvhrMISz2BtESsREpOhZmAUVolhg+h51sh2bNZ4t8I/gEAhqw+N+A/1IDlkdg/1Ib/iMN8d8qB29vmg1KH+gB9QM7qHLN94QOfE/SMmFf1cAOCBvYrraB6ssbyJ7CgfuByGXUrs5lVV2py1Q9tctUbcEHK+s7",
        },
    ],
});
