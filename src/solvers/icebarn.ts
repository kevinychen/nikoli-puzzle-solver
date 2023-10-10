import { Constraints, Context, Network, Point, PointSet, Puzzle, Solution, UnionFind, ValueMap, Vector } from "../lib";

const solve = async ({ And, If, Not, Or, Xor }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a path. When the path visits a cell twice, it must travel in a straight line each time
    const network = Network.all(puzzle.lattice);
    const points = new PointSet(puzzle.lattice, [
        ...puzzle.points,
        ...[...puzzle.junctionSymbols.keys()].flatMap(vs => [...vs]),
    ]);
    const grid = cs.NetworkGrid(points, network);
    for (const [_, arith] of grid) {
        cs.add(Or(arith.isLoopSegment(), arith.isStraight(), arith.isTerminal()));
    }

    // Find the order of the path
    const edges = points.edges().map(([p, _, v]) => [p, v] as [Point, Vector]);
    const root = cs.int();
    const order = new ValueMap(edges, _ => cs.int());
    for (const [p, v] of edges) {
        cs.add(
            If(
                grid.get(p).hasDirection(v),
                Xor(order.get([p, v]).eq(-1), order.get([p.translate(v), v.negate()]).eq(-1)),
                order.get([p, v]).eq(-1)
            )
        );
        cs.add(
            Or(
                order.get([p, v]).eq(-1),
                root.eq(edges.findIndex(([q, w]) => q.eq(p) && w.eq(v))),
                ...points
                    .edgeSharingNeighbors(p)
                    .map(([q, w]) =>
                        And(
                            w.eq(v.negate()) || Not(grid.get(p).isStraight()),
                            order.get([q, w.negate()]).neq(-1),
                            order.get([q, w.negate()]).eq(order.get([p, v]).sub(1))
                        )
                    )
            )
        );
    }

    // The path starts at the IN arrow, and goes through every arrow before reaching the OUT arrow
    for (const [[p, q], symbol] of puzzle.junctionSymbols) {
        const [v] = symbol.getArrows();
        cs.add(order.get([p.translate(v).eq(q) ? p : q, v]).neq(-1));
    }

    // Two perpendicular line segments may intersect each other only on icy cells
    for (const [p, arith] of grid) {
        cs.add(Or(arith.eq(0), arith.isLoopSegment(), arith.isTerminal(), puzzle.shaded.has(p)));
    }

    // The loop may not turn on icy cells
    for (const [p] of puzzle.shaded) {
        cs.add(grid.get(p).isStraight());
    }

    // Connected icy cells are called an icebarn, and every icebarn must be visited at least once
    const uf = new UnionFind<Point>();
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.shaded.has(p) && puzzle.shaded.has(q)) {
            uf.union(p, q);
        }
    }
    for (const [p] of puzzle.shaded) {
        cs.add(Or(...[...grid].filter(([q]) => uf.find(q).eq(uf.find(p))).map(([_, arith]) => arith.neq(0))));
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        for (const v of network.directionSets[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Ice Barn",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdT9swFH3vr0B+9kM+mtHkjQHbC2NjYUJVFFVuMTQirVk+xpSq/51zbwLFTaahSdN4mNzcnhzf+h6797j8XqtCywDDn0hHuhieN+Fn7NDnaVxmVa6jA3lUV0tTAEj5+VzeqLzUo6RLSkebJoyaC9l8jBLhCik8PK5IZXMRbZpPUTOVTYwpIQNwZ22SB3i6g1c8T+i4JV0H+LzDgFNAVRTmYRa3xJcoaS6loDLv+ccExcr80KKTQe8Ls5pnRMxVha2Uy+y+mynra3NXd7luupXNUas2flJLVTq1/k4twVYtoQG1tAlSu8iKRa5nZ39Bbphutzj1rxA8ixLS/m0HJzsYRxvheSIK8J/4/DUO8YWZ82iD6HKcUpaD+cSX1hmDRXqfPcSSCRaz2YkzyAY9FiU/cGGP4yW0ysbneMLR4RhwPOOcU0gMfRwzKntoLscDhmLGxI8Zh8EzdD30tQf5jEPp+pDHGN3+jCnHBUaJKy50zHHM8R0LOKSjfOVh9w/2z/b6WzkJKe8G9vwalI4SEdfFjVpotNTp9a0+OMnUrVmrHO/xUt1rASuL0uSzssuL2OloPnDrejXXhUXlxtzn2drOy27XptCDU0RqFB7In5viem/1B5XnFtFeWxbVesyiqgIGevHOjWcxK1UtLeKF2ayV9LqyBVTKlqju1F611W7P25H4KfiBgxzcFv/vyX9yT9I/4Lw1A781Ody8phh0PugB84MdNHnH93wOvudoKtg3NdgBX4PdtzaovrtB9gwO7hcep1X3bU6q9p1OpXpmp1Iv/Z6ko0c=",
            answer: "m=edit&p=7VRdb5swFH3Pr6j87AewIQHeurbbS9eto9NUoShyUtqgktAB2SYi/vvOtSEJH5OqSdP2MDmYw/G174ntc4uvO5XH3EWTHre4jSaEpx/Hol/b7pIyjYMzfr4r11kOwPmHG/6o0iKeRE3QfLKv/KC65dW7IGI240zgsdmcV7fBvnofVPe8CjHEuAvu2gQJwKsj/KLHCV0Y0raAbxoMeA+o8jz7vggN8TGIqjvOKM0bPZkg22TfYtbIoO9VtlkmRCxVib9SrJOXZqTYPWTPO9ZmqHl1btSGrVr7qFYe1cqDWjmuVjRqV0m+SuPF9R+Q68/rGrv+CYIXQUTaPx+hd4RhsGdCsMDFmUj9cny8atK6R2/r/p6iLIxHknf2GKw/xs6wZOT2Wc8aZd0Bi5RvdWKh+zto5ZXU/aXuLd27ur/WMVeQ6EtsMzILXC5LAMsGE+9o7LsHaAvca+E32Oe2tBpsn2CKsYFrOlNKdKF7R/dTLWBGW4nNPhU4baUxQc5hAbYIiJYlJDjtNiHJhWOQw2XD+Yc4IE8jibmiRY4ZlaKdIWdtHJnTNwhxokWumeEI7pgZzow7XovcqUHeYa5/mAFk4twpd2cGzQxndr13VczJhO21OZwebV49iYSpJdTc16H5JGLhLn9UqxgX/erhKT67TNRTtlUpvsO1eokZCgwrsnRRNHGBrj9cc9vdZhnnHSrNspc02XbjkqdtlsejQ0TGSDwSv8zyh97q31WadohCF9MOZZzfoco86XxrO3SYjSrXHeKkBHRWirdlV0CpuhLVs+pl2xz/cz1hP5h+4GsLNex/9f4r1ZtOwHplDR/W698roa+ocv+WHH15s3zU+aBHzA921OQNP/A5+IGjKeHQ1GBHfA22b21QQ3eDHBgc3C88Tqv2bU6q+k6nVAOzU6pTv0fzyU8=",
        },
    ],
});
