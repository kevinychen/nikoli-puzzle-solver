import { Constraints, Context, Network, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a line from every firefly to make one connected network
    const lattice = puzzle.lattice.dual();
    const points = puzzle.points.vertexSet();
    const network = Network.all(lattice);
    const grid = cs.NetworkGrid(points, network);
    const fireflies = new ValueMap(
        Array.from(puzzle.junctionSymbols, ([vertex, symbol]) => [Point.center(...vertex), symbol.getArrows()[0]])
    );
    for (const [p, arith] of grid) {
        if (!fireflies.has(p)) {
            cs.add(Or(arith.eq(0), arith.isLoopSegment()));
        }
    }
    const root = cs.enum(points);
    cs.addConnected(
        points,
        p => Or(grid.get(p).eq(0), root.is(p)),
        (p, q) => grid.get(p).hasDirection(p.directionTo(q))
    );

    // A black dot indicates where each firefly's path must start
    for (const [p, v] of fireflies) {
        cs.add(grid.get(p).hasDirection(v));
    }

    // A path cannot connect directly between two black dots
    const fireflyLocations = [...fireflies.keys()];
    const instance = new ValueMap(points, _ => cs.enum(fireflyLocations));
    for (const p of fireflyLocations) {
        cs.add(instance.get(p).is(p));
    }
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.eq(0), instance.get(p).eq(-1)));
    }
    for (const [p, q, v] of points.edges()) {
        if (!fireflies.has(q)) {
            cs.add(
                Implies(
                    fireflies.has(p) ? fireflies.get(p).eq(v) : grid.get(p).hasDirection(v),
                    instance.get(p).eq(instance.get(q))
                )
            );
        }
    }

    // No extraneous paths; pick an orientation for each path so that it points to a black dot
    const pathDirections = new ValueMap(points, _ => cs.enum(lattice.edgeSharingDirections()));
    for (const [p, arith] of pathDirections) {
        if (!fireflies.has(p)) {
            cs.add(Implies(arith.eq(-1), grid.get(p).eq(0)));
        }
        for (const v of lattice.edgeSharingDirections()) {
            cs.add(Implies(arith.is(v), grid.get(p).hasDirection(v)));
        }
    }
    for (const [p, q, v] of points.edges()) {
        cs.add(Not(And(pathDirections.get(p).is(v), pathDirections.get(q).is(v.negate()))));
        if (fireflies.has(q) && !fireflies.get(q).eq(v.negate())) {
            cs.add(Not(pathDirections.get(p).is(v)));
        }
    }

    // A number indicates how many turns the firefly's path makes before reaching a firefly (possibly itself)
    const texts = new ValueMap(Array.from(puzzle.junctionTexts, ([vertex, text]) => [Point.center(...vertex), text]));
    for (const p of fireflyLocations) {
        if (texts.has(p)) {
            cs.add(
                Sum(...[...grid].map(([q, arith]) => And(!q.eq(p), instance.get(q).is(p), Not(arith.isStraight())))).eq(
                    parseInt(texts.get(p))
                )
            );
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const p of puzzle.points) {
        for (const q of puzzle.lattice.edgeSharingPoints(p)) {
            const [v1, v2] = puzzle.lattice
                .vertices(p)
                .filter(vertex => puzzle.lattice.vertices(q).some(v => v.eq(vertex)));
            if (network.getDirections(model.get(grid.get(v1))).some(v => v.eq(v1.directionTo(v2)))) {
                solution.borders.add([p, q]);
            }
        }
    }
};

solverRegistry.push({
    name: "Hotaru Beam",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv+Ssqn32A/FiAW9d1u2RsXTJVFUKRk5AGFeLMwLoR5X/ve89EwYYdJm1aDxPh5fHxw/5i++viWyVUwsdwjTzucBcvH/7h9l38Oc21SMssCa74dVXupIKE808h34qsSAZRUxQPjrUf1He8/hBEbMh4c8e8vguO9cegDnk9hybGXWAzyFzGh5DeXtJ7asfsRkPXgTzE3NHvPUC+TVWyzX7qws9BVC84w3He0tuYslx+T5jugp7XMl+lCFaihG8pdumhaSmqjXyqmlo3PvH6Wsud98gdXeRiquVi1pGrxaHadarWWbKc6Y7+qFw/Pp1g2r+A4GUQofavl9S7pPPgCDEMjmw6wldxLjlOKXQ4nZ6//Uy8sV3jezZxHQcRLHELTeyeXMc3EahwScvDWQs0tJdTyxla0BsCHNkQZdqQlI4tqMXanWq93VqUbFLQ+55UDykuYFJ5PaL4jqJDcUJxRjW3FO8p3lAcU3xDNVNclt9auPbE/SU5kevpI4BP+v/jQcTCKl8l6iqUKhcZbMn5ThwSBt5nhcyWRaW2Yg07mY4G2KzA9vSGgTIpD1m6N+vSx71USW8TwmTz2Fe/kmpj9f4ssswA+pwzkPakgUoFhms9C6Xks0FyUe4M0DKn0VOyL00BpTAliidhjZZfvvk0YD8Y3bC7HThd/h+s/+ZgxSVwXptLX5sc2r1S9VofcI/7gfa6vOEdowPvWBoH7LoaaI+xgdreBtS1N8COw4H9wuTYq+1zVGVbHYfquB2Hahs+igcv",
            answer: "m=edit&p=7VRNj5swEL3nV6x8ngMEEj5u2+22lzTtNlutVghFJCEbtCSkhnRbovz3nRlDgoEeKrVqDxXBeTyP7eex3+RfD5GMwcbHcsEAkx7P4Ncz6WdUz31SpLF/BdeHYpNJBAAfp7CO0jweBFVQODiWnl/eQfneD8RQQPWGUN75x/KDX06hnGGXABO5CSJTwBDh7QU+cD+hG0WaBuIpYUONe0S8TmS8Tn+owE9+UN6DoHXe8GiCYpt9i4Wagr+X2XaRELGICtxLvkn2VU9+WGXPhyrWDE9QXiu5sx651kWudZZr9clV4kjtMpHLNJ5P1ES/Va4Xnk6Y9s8oeO4HpP3LBboXOPOPJ9J1FI5FQymXQCnFCR2n3nvNuHY7xnPbjGkYQh1zgxq1ZzINT6dQhclaHmst2NE8TiVn2CLdIZJWm7R7SFZqt0gltj2p0tuN9Tos6n3Hqofc3mNSobS4fcutwe2I2wnH3HL7wO0Ntza3Y45x6Fjw4JpzjPXRmB1wcIe4QUSuycg1gVJBnA3OSHFDcC3FjcAZKw5HVGMdcFWcMwbKLfXaNYdjPYMRWd5VyKkRpg0vtFrZcxGO6wBOHUeMETuN6Hqk08BYVSiplrqC5yugkjarr8M5sZS00yAwXVWQYNT/Hw4CMT1sF7G8mmZyG6VokNkm2scCK5HIs3SeH+Q6WqKvuFABczseoVFplu3TZKfHJU+7TMa9XUTGq6e++EUmV63ZX6I01Yicq65GqQqhUYVMtO9IyuxFY7ZRsdGIRqnQZop3hS6giHSJ0XPUWm172fNpIL4LftFrBta6/2X+75R5OgLjl4p9s9j+sRL2b8nh25vJXusj3eN+ZHtdXvEdoyPfsTQt2HU1sj3GRrbtbaS69kay43DkfmJymrXtc1LVtjot1XE7LdU0fBAOXgE=",
        },
    ],
});
