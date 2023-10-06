import { Constraints, Context, Puzzle, Solution, ValueSet } from "../lib";

const solve = async ({ Implies, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // Every region must be visited exactly once
    const regions = puzzle.regions();
    for (const region of regions) {
        cs.add(
            Sum(
                ...region.flatMap(p =>
                    puzzle.points
                        .edgeSharingNeighbors(p)
                        .filter(([q]) => puzzle.borders.has([p, q]))
                        .map(([_, v]) => grid.get(p).hasDirection(v))
                )
            ).eq(2)
        );
    }

    // Within a region, the loop must pass through all moons and no suns, or all suns and no moons
    // All regions must have at least one moon or sun that is used by the loop
    const symbols = [...new ValueSet([...puzzle.symbols.values()])];
    const whichSymbol = new Map(regions.map(region => [region, cs.int(0, 1)]));
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(
            grid
                .get(p)
                .neq(0)
                .eq(whichSymbol.get(regions.get(p)).eq(symbols.findIndex(s => s.eq(symbol))))
        );
    }

    // The loop may not pass through the same type of clue in two consecutively used regions
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(
                Implies(
                    grid.get(p).hasDirection(p.directionTo(q)),
                    whichSymbol.get(regions.get(p)).neq(whichSymbol.get(regions.get(q)))
                )
            );
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.getDirections(model.get(arith))) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Moon or Sun",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVdT9swFH3vr0B+9kOdr0LeGIO9MDZWJoSiqnJLoBVJzZxkTKn63zn3JtCm8TQJaRoPU5Tb0+Mb33PtHKf4UWmbygiXfyiHUuHyoohvFQR8D9vrallmaXwgj6tyYSyAlF/OzuSdzop0kLRZk8G6PorrS1l/ihOhhBQebiUmsr6M1/XnuL6R9RhDQipw502SB3i6hdc8TuikIdUQ+KLFgDeARbWa5sasGuZrnNRXUlCdD/w0QZGbn6loddD/uclnSyJmukQzxWL52I4U1a15qNpcNdnI+riRO3bI9bdyCTZyCTnkUhckd7608yydnv8FuUeTzQbL/g2Cp3FC2r9v4eEWjuM14gVHxfEmXgvPxzQeTbmznsKLXKwfgFU9duRiA2duELrY0HOyTmWhc97QPa+zi9CpN3JWi6han6VqfZaq9eYdOZWNHBqwIWe8LR7HK+yarH2OHzkOOYYczznnFBuoFHzqQScE4Vcq2iXCgQf/oivGcHaAVSbs+1ue8Eu+T89CLeMQOS0OgGl9CYfIecV4lnaDcwi/1KJnsRaM6RxBr5wPnlaOcARMK/MyD60+88Ajwmjumls84RhwjLj1Eb3Ob37h37bKf5STeFjt1wvdvRVPBok4vb1PDy6MzXUGw48X+jEVOFlFYbJpUdk7Pcc5wQcv3iBwqyqfpbZDZcY8ZstVN295vzI2dQ4RmaKsI39m7O3e7E86yzpE8yHpUM2J16FKi+Ns57+21jx1mFyXiw6xc/R1ZkpXZVdAqbsS9YPeq5Zve94MxC/Bd+Ljs+X//2z9o88WbcHwvXn5vcnht9dYp/VBO9wP1unylu8ZHXzP0lSw72qwDmOD3fc2qL69QfYcDu43JqdZ931OqvatTqV6bqdSu4ZPJoNn",
            answer: "m=edit&p=7VVdT9swFH3vr0B+vg+NPyFvjMFeGBsr04SiqkpLoBVpw5J2TKny37nXdkjTetKENG0PUxT39Phe+/jGx66+b9IyA42POIYhRPhwre0bSWnfoX9uFus8i4/gdLOeFyUCgE8XF3Cf5lU2SHzUeLCtT+L6GuoPccIiBozjG7Ex1Nfxtv4Y17dQj7CLQYTcpQviCM87+M32EzpzZDREfOUxwluE1WY1WRbFyjGf46S+AUbzvLPZBNmy+JExr4P+z4rldEHENF3jYqr54sn3VJu74nHD2ikaqE+d3FFArujkile5IiyXe7mzRTnLs8nlH5B7Mm4aLPsXFDyJE9L+tYPHHRzF24Z0URvZ9jbeMi5wGA79ejKuQ6yQyEYHrAmxMhgrVYhVPMgGlanguCo8bnAVKqhXB2fTMsiqIKtD45qgMhPQgB/kwn4Wbtsb/GpQC9u+t+3Qtsq2lzbmHD9gFKFPOepEQfgLkfBYcvSv8BidLbnDQnQ84TZeUK7yWGGMxxKx8ljJHYy5qp2LsOjipfaYzhHj45HXPlcjNjvjaJ+rERvCDfmKlnhmW2lbbZduaDvjht8tjW6LwjgH2tICCAnukADhOQW0tR2ixRLCw89xgoN0GVgX6TKwEtLFCQ3SxWFllYvDddNGJyRBeaRAuQxcPS2ekAHlkOKgXS7W0scpA9r1ag7G9WoJWrXIuJGxatopwPPZeGTAuFyDuU6zEW2G0a7X7ZU9+7v9NGqPgtc9R4VvBgnWL3p91NvxeJCw87uH7OiqKJdpjkfYaJ4+ZQzvClYV+aTalPfpDE8+e5WA5Vab5TQre1ReFE/5YtWPWzysijILdhGZ4bSB+GlR3u2N/pzmeY+o7NXYo9wZ3qPW5aL3Py3L4rnHLNP1vEfsHOa9kbLVui9gnfYlpo/p3mzLbs3NgP1k9k0EXsTi/0X8ly5i+gTDN1/Hb7sDfuOw/Lfk2N1blEHrIx1wP7JBl3v+wOjIH1iaJjx0NbIBYyO7722kDu2N5IHDkfuFyWnUfZ+Tqn2r01QHbqepdg2fjAcv",
        },
    ],
});
