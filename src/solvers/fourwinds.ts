import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a horizontal or a vertical line in each white cell
    const grid = new ValueMap(puzzle.points, p => cs.choice(puzzle.lattice.edgeSharingDirections(p)));

    // Each number represents the total number of white cells occupied by the lines from that number
    // (A line is represented by an arrow coming out of the number)
    for (const [p, text] of puzzle.texts) {
        cs.addSightLineCount(
            puzzle.lattice,
            puzzle.points,
            p,
            (q, bearing) => Or(q.eq(p), bearing ? grid.get(q).is(bearing.negate().from(p)) : false),
            parseInt(text) + 1
        );
    }

    // Lines cannot enter other numbered black cells
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(-1));
    }

    const model = await cs.solve(grid);

    // Fill in solved lines
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value !== -1) {
            solution.lines.set([p, p.translate(puzzle.lattice.edgeSharingDirections(p)[value])], true);
        }
    }
};

solverRegistry.push({
    name: "Four Winds",
    keywords: ["Line Game"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRPb5tAEMXvfIpoz3vgb+NwS9O4F5c2tasoQsha2yRGAW+6QFOt5e+emQELL1CpPaTNoVozGv92YN7Cvi2/10KlPIDhTbjNHRiuO6HLt/F3HIusytPwjF/W1VYqSDj/PJ3ye5GXqRW3VYm11xehvuH6Yxgzh3HmwuWwhOubcK8/hTrieg5TjPvAZk2RC+l1l97SPGZXDXRsyKM2h/QO0nWm1nm6nDXkSxjrBWfY5z3djSkr5I+UtTrw/1oWqwzBSlSwmHKbPbUzZb2Rj3Vb6yQHri8bufOjXOzSyvU6uZg2cjEbkYureGW5F8nhAK/9KwhehjFq/9alky6dh3uIUbhnroO3BqCl+TbMcxF4HfDtPhhUnCPwOxBMjq+PALRyqOEdxSlFl+IC9HDtUfxA0aYYUJxRzTXFW4pXFH2K76jmHFf0R2v+C3Jit7EPjuD3ssSKWVQXq1SdRVIVImdgIFbKfFnW6l6sYTuQv+CLA9tRpYFyKZ/ybGfWZQ87qdLRKYTp5mGsfiXVpvf0Z5HnBmhOCwM1G9tAlYJde/JfKCWfDVKIamuAkx1uPCndVaaASpgSxaPodSu6NR8s9pPRFXtwOnn/T6d/dDrhJ7Dfml/fmhzavVKNWh/wiPuBjrq85QOjAx9YGhsOXQ10xNhA+94GNLQ3wIHDgf3C5PjUvs9RVd/q2Grgdmx1avg4sV4A",
            answer: "m=edit&p=7VRNj5swEL3nV6x8ngPYkA9u2+2mlzTtNqlWKxRFJGE3aCFsDelWRPnvnRlDCIFK7aEfh8owejyPPc/Gz9mXfaBDcLGpIVhgY5NyyK9j0VO1eZTHoXcF1/t8m2oEAB/GY3gM4izs+WXWoncoRl5xB8U7zxe2ACHxtcUCijvvULz3iikUM+wS4CA3MUkS4W0N77mf0I0hbQvxtMQIHxCuI72Ow+XEMB89v5iDoDpveDRBkaRfQ1HqoO91mqwiIlZBjovJttFL2ZPtN+nzXlQljlBcG7mzSq5dy1W1XHWSq7rlyt8vd7Q4HnHbP6HgpeeT9s81HNZw5h2OpOsgpE1DXdRi/o1QkghVE451SbQyBkQ4NeEOq+1jAkvZXPCB45ij5DhHPVAojm85WhxdjhPOueV4z/GGo8OxzzkDWhGu+XyOfjVaSAtohQoPHx1mgyRIZZAC6Rg0wjNf5SmLkbLBKZECx4xFY9BqCY1OvRIcU8MZgGNmIb+MDLLBNXmOBPeU5/YZuYjMCNcC14xwbejTiNPSpxzNFprtmZ1tp9lC2p5jz5fGttTcn0OLni+m+2QV6qtpqpMgFmhckaXxMtvrx2CNx5B9DcztOLNBxWn6Eke7Zl70tEt12NlFZLh56spfpXpzMftrEMcNIuNbqkEZQzWoXEeN70Dr9LXBJEG+bRBnzmrMFO7ypoA8aEoMnoOLakm95mNPfBP8+gpvRfX/VvxLtyL9AuuX7sY/cm39W3L49Ka60/pId7gf2U6Xl3zL6Mi3LE0F265GtsPYyF56G6m2vZFsORy5H5icZr30Oam6tDqVarmdSp0b3l/0vgM=",
        },
    ],
});
