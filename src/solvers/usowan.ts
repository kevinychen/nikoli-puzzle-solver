import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Iff, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // You're given a board divided into regions
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded cells cannot be horizontally or vertically adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
    }

    // Numbers cannot be shaded
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // A number indicates how many of the (up to 4) orthogonally adjacent cells are shaded
    // However, every region contains exactly one incorrect number, which must not indicate the
    // amount of shaded cells
    const regions = puzzle.regions();
    const isLie = new ValueMap(regions, _ => cs.enum(puzzle.points));
    for (const region of regions) {
        cs.add(Or(...region.filter(p => puzzle.texts.has(p)).map(p => isLie.get(region).is(p))));
    }
    for (const [p, text] of puzzle.texts) {
        cs.add(
            Iff(
                Sum(...puzzle.points.edgeSharingPoints(p).map(p => grid.get(p))).neq(parseInt(text)),
                isLie.get(regions.get(p)).is(p)
            )
        );
    }

    // All unshaded cells on the board form an orthogonally connected area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(0));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Usowan",
    keywords: ["Uso-one"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZNb+s2ELz7VwQ68yCSkvVxS1Onlzz3pUkRBIIRyI6SGJGtVLZfChn+75ld0hUlqyiKoq85FILI0Wi5O1xyKW1+2+V1IWJcOha+kLh0oPhWfsK3b6/b5bYs0jNxvtu+VDWAED9fXoqnvNwUo8xazUb7Jkmba9H8lGae9ISncEtvJprrdN98SZuJaG7wyhMS3JUxUoCTFt7xe0IXhpQ+8NRiwHvAxbJelMXDlWG+pllzKzyK8wOPJuitqm+FZ3XQ86JazZdEzPMtJrN5Wb7ZN5vdY/W6s7ZydhDNuZF7MyBXt3IJGrmEBuTSLP5lucnscEDaf4HghzQj7b+2MG7hTbpHO033nhrTUKyMNGvjqfg4dUtonwjfIWRviFa9IQFbOETIPpwhIQ9xnIYhEdohWJjjYxz0LCImHKcR+3CJqE8kPR8xK3V0xDx9h0j60hOW7hI8xCU4iuND+v0w0tcnDKt3GdlPtJT92FL2kyAlT/qPxGGdJa/2PbeX3Cpub7EZRKO5/ZFbn9uQ2yu2mWCPyDARMoIYBY8RDoYY4gnHWsgEsgknIY4IhAZW/tjBxGMtGUdCSSSHsMSRQjuJsPZbrIhHzo9+JLLL9nHLawmMVDDG8RQgCYSDQCjaN4xhE1gbOsICoxl9a09jteU1eH3k4UebeaEHtj419Gg7L7IPrE0Am9DyNC9ldSrMSx3nBT3K6lGIq2xcBT/KxlWIq9p8ysTERQ9s/KMHNjlBD2zyiR55PuYNcWnLHTFtG9ZGcU0sOVZYU4ujAGtqY8UUy/of4zMQmbHoYWPtY9izNmyQO94mF9wG3I55+0R00vyts+if79S/lJMpzK5zIcvf83k2yrzJ43NxNq3qVV7iDJ/uVvOiPj7jo+ltqvJhs6uf8gU+AfxNxSkPbs2WHaqsqrdyue7aLZ/XVV0MviKyQPgB+3lVP/a8v+dl2SHMP0KHMh+zDrWt8aVynvO6rt47zCrfvnQI56vW8VSst10B27wrMX/Ne9FW7ZwPI+93j+9M449E//9H8h/9kdAS+J/tLPhscnj3VvVg6YMeqH6wg1Vu+ZNCB39S0hTwtKrBDhQ22H5tgzotb5AnFQ7uT4qcvPbrnFT1S51CnVQ7hXILPpuNPgA=",
            answer: "m=edit&p=7VZLb9swDL7nVxQ+6yBSsiXn1nXtLl23rh2GIggKt3XboE7dOck6uMh/HyUxcaxkwIZhj8NgWPz0mSKpBynPPi+KphSWHmWFFECP0uhflLl/JT/nk3lVDvfE/mJ+XzcEhHh3dCRui2pWDkasNR68tPmwPRXtm+EogUQkSC8kY9GeDl/at8P2ULRn9CkRQNxxUEKChx385L87dBBIkIRPGBO8IHg9aa6r8vI4MO+Ho/ZcJM7PKz/awWRafykTjsP1r+vp1cQRV8WcJjO7nzzxl9nipn5YJCsXS9Huh3DPdoSrunDVOly1O1z8/eHm4+WSlv0DBXw5HLnYP3bQdvBs+LJ0cb0kmLmhtDMQ9iZBu5o6E0o6Qm4QEA1RGA3REBGpjIakGBlNU0eoDSKLbGQ60jA6MmrSmDAxkUc2LERxWBsReRx6jjFhYyKPbICM3YBUW0waMxAvNEDsGyBeBADTWzjaZ/C7feHbI9+ib8/pMIhW+fa1b6VvU98ee51DOiOQ5gIMBYNk0VBhsCpgqwTkacB5SiXCeIwy28COzxgbgZAHDFRSVLCJSnYYHS87O2BZ33a8AsLImMqT1gFrLTBlX5p0NOu4EqYVY9Xpu7GKeUW8WvFkR6WMKX7FNhXFo0ynr1lHk05qunkhx4k0L1zNi+JBjgfJL7JfJDvIfpH8YreekGeMM8KGsSFsGVvCOWNXolfrRn4ldBjYL+DaF2RIe8rYaNpT9mWzzn5G14BB1iF9y/pWc2xLV/LcMTnwrfZt5o+PcZWGatHm8cr6ByuUoPUBDYfvzBUlmhOdXrc1TlgvdOilEIQOwniRpUGEnsm8sDKI0MvDOJCSJQYJ3AfF0qmv0yWkiJvjcjDCzN+K3ZP+2f54MEoOb+7KvZO6mRYVXQAni+lV2az6dOMms7q6nC2a2+Ka7g9/IQvPPXrNHlXV9VM1eezrTe4e66bc+cmRJbnfoX9VNzeR9eeiqnrEzP9g9KhwE/aoeTPp9YumqZ97zLSY3/eIjSuxZ6l8nPcDmBf9EIuHIvI27ea8HCRfE/+OFP3OqP+/M3/pd8Ztgfypn5pfv/J+oK79W+H401s3O1Of6B3ZT+zOLGd+K9GJ30pp53A7q4ndkdjExrlN1HZ6E7mV4cR9J8md1TjPXVRxqjtXW9nuXG0m/Gg8+AY=",
        },
    ],
});
