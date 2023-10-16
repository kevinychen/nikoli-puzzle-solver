import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in some cells, and shade the other cells
    // Numbers must be between 1 and N-2, where N is the width of the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, puzzle.width - 2));

    // Every row and column has exactly 2 shaded cells
    for (const [line] of puzzle.points.lines()) {
        cs.add(Sum(...line.map(p => grid.get(p).eq(0))).eq(2));
    }

    // Each row and column contains exactly one of each number
    for (const [line] of puzzle.points.lines()) {
        for (let i = 1; i <= puzzle.width - 2; i++) {
            cs.add(Or(...line.map(p => grid.get(p).eq(i))));
        }
    }

    // A clue outside the grid indicates the sum of the numbers which appear between the two shaded
    // cells in the corresponding row or column
    for (const [line, p] of puzzle.points.lines()) {
        if (puzzle.texts.has(p)) {
            const choices = [];
            for (let i = 0; i < line.length; i++) {
                for (let j = i + 1; j < line.length; j++) {
                    choices.push(
                        And(
                            grid.get(line[i]).eq(0),
                            Sum(...line.slice(i + 1, j).map(p => grid.get(p))).eq(parseInt(puzzle.texts.get(p))),
                            grid.get(line[j]).eq(0)
                        )
                    );
                }
            }
            cs.add(Or(...choices));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells and numbers
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value === 0) {
            solution.shaded.add(p);
        } else {
            solution.texts.set(p, value.toString());
        }
    }
};

solverRegistry.push({
    name: "Doppelblock",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wK7TllnXNLhlbl0xVhVDkJLRBhbgzsE6O8r/3vQcTMTBpPWzrYbL89PLxw/469tflt1qolAfQvAtucweaGwTUHd+nbrdtmVV5Gp7xaV3tpIKE80+zGb8XeZlasUNf24l10JehvuH6Qxgzh3HmQndYwvVNeNAfQx1xvYAhxh1g86bIhfS6S29pHLOrBjo25FGbQ3oH6SZTmzxdzRvyOYz1kjNc5x19jSkr5PeUtTrw90YW6wzBWlSwmXKXPbUjZb2Vj3Vb6yRHrqeN3MWIXK+Ti2kjF7MRubiLPyz3Mjke4W//AoJXYYzav3bpRZcuwgPEKDww18dPA9DSnA1zAwRwVD+B5yKYdGBCwO/AOQHcLQGY2aH57yjOKLoUl7A81x7F9xRtihOKc6q5pnhL8YqiTzGgmnPcwKu2+BfkxJ5HfsEGbvmdLLFiFtXFOlVnkVSFyBn4hZUyX5W1uhcbOH2yExwwsD1VGiiX8inP9mZd9rCXKh0dQphuH8bq11Jte7M/izw3QPM8GKi5xwaqFFzSk99CKflskEJUOwOcXGhjpnRfmQIqYUoUj6K3WtHt+WixH4x67MFz5P1/jP7RY4RHYL81v741OXR7pRq1PuAR9wMddXnLB0YHPrA0Ljh0NdARYwPtexvQ0N4ABw4H9guT46x9n6OqvtVxqYHbcalTw8eJ9QI=",
            answer: "m=edit&p=7VTNb5swFL/zV1Q++wAYTMut65pdsmxdMlUViiKS0AYV4s7AOhHxv+/5mYRgmLQd9nGYLD8///z8PjC/V3ypYplQDoNdUps6MFzOcTqeh9NuxyItsyS8oNdVuRMSFEo/TCb0Mc6KxIocvG0vrUN9FdZ3tH4XRsQhlLgwHbKk9V14qN+H9YzWczgi1AFsqo1cUG879R7PlXajQccGfdbqoD6AuknlJktWU418DKN6QYmK8wZvK5Xk4mtC2jzUfiPydaqAdVxCMcUufWlPimornityDNHQ+lqnOx9Jl3XpslO6bDxd9/ene7VsGvjsnyDhVRip3D936mWnzsNDo/I6ENdTVznkot+GuFwBbgcwVwF+B/gIeB0QuMevhQB4dtD/A8oJShflAsLTmqF8i9JG6aOcos0tynuUNyg9lBxtAlUAlHjugw9uq8oYa7Nyj4X4bWUnAEtlHeAxE/CMKx43nPqeCfiGDz8wfHDPsODctAgMpwEzLALftAh6Tk9voL/vXH0PCAsPxAJcPF8veuczvXBcuN5xbRLoe4E6Oz2qfkj1SI0VMYbdQg3+c9rSisisyteJvJgJmccZgW5BCpGtiko+xhv497GZUMT2aNmDMiFesnTft0uf9kImo0cKTLZPY/ZrIbeG99c4y3pAgc2xB2kW96BSpr19LKV47SF5XO56wBmde56SfdlPoIz7KcbPsREt72puLPKN4IwYNGP2vxX/pVasnsD+pYb8R5rnv5UO/r1CjlIf4BH2AzrK8hYfEB3wAaVVwCGrAR0hNqAmtwEa0hvAAcMB+wHJlVeT5york+oq1IDtKtQ54aOl9R0=",
        },
        // {
        //     puzzle: "m=edit&p=7ZRfb5s8FMbv+RSVr30BOP/gruua3WTZumSqKoQiJ6ENKsSdgXUiynfvOQc6MLCLSe+79WKyfHT4+dh+DDzOvhVSR3wGTcy4zR1oYuRSd22Pul23dZwnkX/BL4v8oDQknH+az/m9TLLIChyabYfWqfT88oaXH/yAOYwzF7rDQl7e+Kfyo18uebmCIcYdYIuqyIX0uklvaRyzqwo6NuTLOof0DtJdrHdJtFlU5LMflGvOcJ93NBtTlqrvEat14PNOpdsYwVbmcJjsED/VI1mxV49FXeuEZ15eVnJXA3JFIxfTSi5mA3LxFP+zXC88n+G1fwHBGz9A7V+bdNakK/8EcemfmDvFqR5oqb4Nc2e0Fnyrn8RDMmmAsDtzhIvAbgFBi7QJLTttwJgWaW0zHb2+8xrMJp0pXiVt3BAHtmhrg0M5dLQ7inOKLsU1nJyXguJ7ijbFMcUF1VxTvKV4RXFEcUI1U3x3v/V2/4CcQHhk1dc2+e+fQitgyyLdRvpiqXQqEwbWZplKNlmh7+UOflRyPvyLwI5UaaBEqackPpp18cNR6WhwCGG0fxiq3yq976z+LJPEANVNZqDKcgbKNfip9Sy1Vs8GSWV+MEDLe8ZK0TE3BeTSlCgfZWe3tDnz2WI/GPVAwM0p/t2bf+nexE9gvzV/vzU59PcqPWh9wAPuBzro8pr3jA68Z2ncsO9qoAPGBtr1NqC+vQH2HA7sFybHVbs+R1Vdq+NWPbfjVm3DB6H1Ag==",
        //     answer: "",
        // },
    ],
});
