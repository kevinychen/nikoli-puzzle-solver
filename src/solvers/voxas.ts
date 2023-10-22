import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Not, Or, Xor }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines over the dotted lines to divide the board into several areas
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Some lines are given
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Or(grid.get(p).neq(grid.get(q))));
        }
    }

    // All areas must be rectangular in shape, and must be 2 or 3 cells in size
    const strips: Point[][] = [];
    for (const p of puzzle.lattice.representativeCells()) {
        const bearing = puzzle.lattice.bearings()[0];
        for (const len of [2, 3]) {
            strips.push(bearing.line(p, len));
        }
    }
    const placements = puzzle.points.placements(strips);
    const sizeGrid = new ValueMap(puzzle.points, _ => cs.int());
    const orientationGrid = new ValueMap(puzzle.points, p => cs.choice(puzzle.lattice.edgeSharingDirections(p)));
    for (const [p] of grid) {
        cs.add(
            Or(
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(
                            ...placement.map(p => grid.get(p).eq(type)),
                            ...placement.map(p => sizeGrid.get(p).eq(strips[instance].length)),
                            ...placement.map(p => orientationGrid.get(p).is(placement[0].directionTo(placement[1])))
                        )
                    )
            )
        );
    }

    // Two rectangles divided by a black circle must have different size and different orientation
    // Two rectangles divided by a white circle must have the same size and orientation
    // Two rectangles divided by a grey circle must have the same size or the same orientation, but not both
    for (const [[p, q], symbol] of puzzle.junctionSymbols) {
        const sameSize = sizeGrid.get(p).eq(sizeGrid.get(q));
        const sameOrientation = orientationGrid.get(p).eq(orientationGrid.get(q));
        if (symbol.isBlack()) {
            cs.add(Not(Or(sameSize, sameOrientation)));
        } else if (symbol.isWhite()) {
            cs.add(And(sameSize, sameOrientation));
        } else {
            cs.add(Xor(sameSize, sameOrientation));
        }
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
    name: "Voxas",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRfT9s+FH3vp0B+9oPttNDkjTG2F9aNXzshFEXILYFGJDVzkjGl6nfnXCeozR+0CU368TC5uTo9vvE91/Fx/qPUNuYTDG/KBZcYSk3dMxb0exmLpEjj4IiflsXaWADOv874nU7zeBQ2SdFoW/lBdcmrz0HIJONM4ZEs4tVlsK2+BNU1r+aYYlyCu6iTFOD5Hl65eUJnNSkF8KzBgNeAq8Su0vhmPq8zvwVhteCMCn1wrxNkmfkZs0YI/V+ZbJkQsdQFmsnXyWMzk5e35qFscmW049VprXc+oNfb6yVY6yU0oJfEHei9qBf6q3L9aLfDvv8HwTdBSNq/7+F0D+fBFnHmonTxOtgy6Uus46Faa0fBe+Blj1dCvcKPwas+fzwZzj8hfiDfF4N6PEF8Nx9NfHKtKBcX6JRXnosfXRQuTly8cDnn1LTwuZRYEOtJiTMv0RRhBQcobIjjkaOmDQ/svWAFHptDWIzxbo19QEEQNa5cpTMXxy4eOwUn9CXe/K3e1uxv5YTUdDMmf4aiUcjOb+/jo5mxmU5xKudr/Rgz+J/lJr3JS3unVzjM7nrAeQW3KbNlbFtUasxjmmzaecn9xth4cIrIGGUH8pfG3nZWf9Jp2iLqu65F1YepRRUWnjv4r601Ty0m08W6RRz4s7VSvCnaAgrdlqgfdKdatu95N2K/mHtgB4EL5t/l+j9drvQNxHuz7XuT446vsYPeBz1gf7CDNm/4ntPB9zxNBfu2BjvgbLBdc4Pq+xtkz+LgXnE5rdo1Oqnqep1K9exOpQ4dH0ajZw==",
            answer: "m=edit&p=7VVNb5tAFLz7V0R73sN+2I7hlqZpL27alFRVhKwIOyRGwSYF3FRY/PfOWxZjPiJFUaX2UGGexsNjdt7uviX7sQvSkE9w6RkXXOJSambusaBffV1HeRy6J/xsl6+TFIDzz5f8PoizcOTbpMVoXzhuccWLj67PJONM4ZZswYsrd198cosbXnh4xLgEN6+SFOBFA7+b54TOK1IK4EuLAW8AV1G6isNbz6syv7h+cc0ZDfTOvE6QbZKfIbNG6P8q2SwjIpZBjmKydfRkn2S7u+Rxx+oxSl6cVX69Ab+68asPfvWwX9X2O6+E/qhdZ1GWmPevMHzr+uT9WwNnDfTcfUm+KEoTb9w9k46EjuadGQWvwcser4R6gR+DV31+OhnOP50M5zti0I8WYiAfRXwwpSgTr1EpL7SJ700UJk5MnJucCypaOFxKCEJPSux5qSqs0AFKWh45amZ5YF1jBV5XWIzxboUdQEGwpC1BI52bODZxahyc0kpgrY4dTjveHMgLWNAkD2s03warSl83QxlaA48tJn5isa2wlqmxRIXSyteVG6yqSvRRVYd8x2KaEatTz5TB0FG1jm5wPVP6aDYP71pNM7NWU4PXVlNDU9c6M+DTo3zS6ezlaqG9el8fNgMtRTnyVXW00TV5HVqMfHZx9xCeXCbpJojRed46eAoZzjiWJfFttkvvgxUa1hyB3HDb3WYZpi0qTpKnONq286KHbZKGg4+IDDHsQP4ySe866s9BHLeIzJznLapqmBaVp1Hrf5CmyXOL2QT5ukUcnUEtpXCbtw3kQdti8Bh0Rts0NZcj9ouZGy0vcIj+/4D8pQ8IrYF482fkbefwK07Kf8uO2b5JOtj7oAfaH+xgm1u+1+ngez1NA/bbGuxAZ4PtNjeofn+D7LU4uBe6nFS7jU6uur1OQ/XanYY67nh/MfoN",
        },
    ],
});
