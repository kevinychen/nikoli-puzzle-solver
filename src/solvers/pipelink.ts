import { Constraints, Context, FullNetwork, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a loop that goes through every cell
    // Two perpendicular line segments may intersect each other, but they may not turn at their
    // intersection or otherwise overlap
    const network = new FullNetwork(puzzle.lattice);
    const grid = cs.NetworkGrid(puzzle.points, network);
    for (const [_, arith] of grid) {
        cs.add(arith.neq(0));
        cs.add(Or(arith.isLoopSegment(), arith.isStraight()));
    }

    // Crossing loop is connected
    const edges = puzzle.points.edges().map(([p, _, v]) => [p, v] as [typeof p, typeof v]);
    const root = cs.int();
    const tree = new ValueMap(edges, _ => cs.int());
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(
            Or(
                root.eq(edges.findIndex(([q, w]) => q.eq(p) && w.eq(v))),
                ...puzzle.lattice
                    .edgeSharingDirections(q)
                    .map(w => And(grid.get(q).isLoopSegment(), tree.get([p, v]).lt(tree.get([q, w]) || 0))),
                And(grid.get(q).isStraight(), tree.get([p, v]).lt(tree.get([q, v]) || 0))
            )
        );
    }

    // Some cells have given loop segments. These cells cannot have other lines added to them
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(grid.get(p).is(symbol.getArrows()));
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
    name: "Pipelink",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTfb9MwEH7PX4H87If8aKHN2xgrL2UwVjRVVlS5rbdGS+rhJAy56v++u0sgdZJJCGliD8jN6fN3V9/n2F+K75U0io9hRBPu8wBGGE7oGfn4+zUWaZmp+A0/q8qdNgA4/zyb8VuZFcoTTVXiHew0tlfcfowFCxhnITwBS7i9ig/2U2yX3F5DivEAuHldFAK8aOEN5RGd12TgA75sMMAlwI3RRVFPv8TCLjjDJu/prwhZrn8o1ojA+Ubn6xSJtSxhJ8UufWgyRbXV91VTGyRHbs9qrdcDWqNWK8JaK6IBrbgF0pqaTaZW8xeQO02OR3jnX0HwKhao/VsLJy28jg8QLykGFJfxgUU+LCPwzGFg098vlY0CTOGh9lPTZ/4Fq85o7ZDiAlpzG1H8QNGnOKY4p5oLijcUzymOKL6lmnco/q+390JyRFjbBMf4z1DiCXAGK3S2KipzKzdw1GQcOE3g9lW+VsahMq0fsnTv1qV3e23UYApJtb0bql9rs+2s/iizzCHqz4BD1ZfWoUoDN/JkLo3Rjw6Ty3LnECe311lJ7UtXQCldifJedrrl7Z6PHvvJ6BER3NDo/2fnX3x28P37r82dr00OXV1tBn0P9ID1gR20eMP3XA58z8/YsG9pYAdcDWzX2ED1vQ1kz97APeNwXLVrclTV9Tm26lkdW526XSTeEw==",
            answer: "m=edit&p=7VRNb5tAEL37V1R7ngPsgg3c0jTuxf1I7SqykGVhm8Qo2KQLNBUW/z0zu4DNR6SqUtQeKmD0eDM7+2D3bfojD2QINl7CAQNMvDh31GMZdNfXIsri0HsHV3m2TyQCgC/TKdwHcRqO/KpqNToVrlfcQvHR85nJgHF8TLaC4tY7FZ+8YgnFHFMMTORmuogjvDnDO5UndK1J00D8ucIIlwi3MklT/frV84sFMJrkvRpKkB2SnyGrRND7NjlsIiI2QYZfku6jpyqT5rvkMWd1/xKKK611PqBVnLWKRqsY1sprrZHcxuF69gZy3VVZ4j//hoLXnk/av5+hc4Zz71SSLoqmikvvxISBbXxTrbpJkzY/lVkmpQy9JTop95VR2HWqenMVFzg1FELFDyoaKtoqzlTNjYp3Kl6raKk4VjUTEo+fd9ljXI9m3ACOKgUo5GpkAn0UIQ5c1EhUdQK4pZEFosq69Qhh1HWEdD+B/XiNrKqOg1XVCbCqrNOMQONMNHKbEYgchchTZoP0CIuDXXETsMcaOU3WBdtokO5iG2DrrG3CWGftMdh6XnvS1Lk62/zoyw2gF2Neb4ZmwWgxypHP9WFAl/17aDXy0f8sTeJ1msv7YIsbWh0PoLhjftiEskXFSfIUR8d2XfRwTGQ4mCIy3D0M1W8Suet0fw7iuEWk6rBrUdqaLSqTUes9kDJ5bjGHINu3iAuPtjqFx6wtIAvaEoPHoDPb4fzN5Yj9YurxBfpQ/D9c/8bhSv/f+OMj9s2OxH9Ljtq6iRz0PdID1kd20OIV33M58j0/04R9SyM74Gpku8ZGqu9tJHv2Ru4Vh1PXrslJVdfnNFXP6jTVpdvx9HwB",
        },
    ],
});
