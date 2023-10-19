import { Constraints, Context, FullNetwork, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a line from every firefly to make one connected network
    const lattice = puzzle.lattice.dual();
    const points = puzzle.points.vertexSet();
    const network = new FullNetwork(lattice);
    const grid = cs.NetworkGrid(points, network);
    const fireflies = new ValueMap(
        Array.from(puzzle.junctionSymbols, ([vertex, symbol]) => [Point.center(...vertex), symbol.getArrows()[0]])
    );
    for (const [p, arith] of grid) {
        if (!fireflies.has(p)) {
            cs.add(Or(arith.eq(0), arith.isLoopSegment()));
        }
    }
    const root = cs.choice(points);
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
    const instance = new ValueMap(points, _ => cs.choice(fireflyLocations));
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
    const pathDirections = new ValueMap(points, p => cs.choice(lattice.edgeSharingDirections(p)));
    for (const [p, arith] of pathDirections) {
        if (!fireflies.has(p)) {
            cs.add(Implies(arith.eq(-1), grid.get(p).eq(0)));
        }
        for (const v of lattice.edgeSharingDirections(p)) {
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
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.borders.add(lattice.edgeVertices(p, p.translate(v)));
        }
    }
};

solverRegistry.push({
    name: "Hotaru Beam",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv+Ssqn32A/FiAW9d1u2RsXTJVFUKRk5AGFeLMwLoR5X/ve89EwYYdJm1aDxPh5fHxw/5i++viWyVUwsdwjTzucBcvH/7h9l38Oc21SMssCa74dVXupIKE808h34qsSAZRUxQPjrUf1He8/hBEbMh4c8e8vguO9cegDnk9hybGXWAzyFzGh5DeXtJ7asfsRkPXgTzE3NHvPUC+TVWyzX7qws9BVC84w3He0tuYslx+T5jugp7XMl+lCFaihG8pdumhaSmqjXyqmlo3PvH6Wsud98gdXeRiquVi1pGrxaHadarWWbKc6Y7+qFw/Pp1g2r+A4GUQofavl9S7pPPgCDEMjmw6wldxLjlOKXQ4nZ6//Uy8sV3jezZxHQcRLHELTeyeXMc3EahwScvDWQs0tJdTyxla0BsCHNkQZdqQlI4tqMXanWq93VqUbFLQ+55UDykuYFJ5PaL4jqJDcUJxRjW3FO8p3lAcU3xDNVNclt9auPbE/SU5kevpI4BP+v/jQcTCKl8l6iqUKhcZbMn5ThwSBt5nhcyWRaW2Yg07mY4G2KzA9vSGgTIpD1m6N+vSx71USW8TwmTz2Fe/kmpj9f4ssswA+pwzkPakgUoFhms9C6Xks0FyUe4M0DKn0VOyL00BpTAliidhjZZfvvk0YD8Y3bC7HThd/h+s/+ZgxSVwXptLX5sc2r1S9VofcI/7gfa6vOEdowPvWBoH7LoaaI+xgdreBtS1N8COw4H9wuTYq+1zVGVbHYfquB2Hahs+igcv",
            answer: "m=edit&p=7VTBbptAEL37K6I9z4E12Czc0jTtJXWbOlUUISvCDo5RsEkX3LRY/vfMzGKbBXqo1Ko9VITN89vZ2bezvCm+bmOdgIePq8ABSU/g8BtI+nPq5yYtsyQ8g/Ntuco1AoCPE1jGWZEMojpoNthVQVhdQ/U+jMRQQP3OoLoOd9WHsJpANcUpARK5K0RSwBDh5Qne8jyhC0NKB/GEsGPW3SFepjpZZj9M4Kcwqm5A0D5veDVBsc6/JcKk4N+LfD1PiZjHJZ6lWKXP9UyxfciftnWsnO2hOjdypz1y3ZNc9yjX7ZNrxJHaRaoXWXJ/ZRL9VrnBbL/Hsn9GwfdhRNq/nKA6wWm425OunfBdWkq1BCopJvT9w9kPjPLaMYFqM9JxhLnmBjVqZ5JOYFOoQrKWu4MWnGhep5EzbJFqiKTbJr0ekpV6LdKIbSc1eruxQYdFve9Y9ZDHGywqVC6Pb3l0eBzxeMUxlzze8njBo8fjmGN8uha8uGaOsb0aqwM+nhAP6HvgjwxyQUlGSgIVhdAQlHtAgWPiRuCPDYcr6ixjoNoS54Gq8/kHRJZXBvkNxDUiqBCajFhMxLKBVY2xe1DxGI8R+zX26xjzCR4/AVO06eFzOBaWirYfRFKZhgSj/v+zQSQm2/U80WeTXK/jDA0yXcXPicBOJIo8uy+2ehkv0FfcqIC5Da+wqCzPn7N0Y8elj5tcJ71TRCYPj33x81w/tLK/xFlmEQV3XYsyHcKiSp1av2Ot8xeLWcflyiIarcLKlGxKW0AZ2xLjp7i12/p05v1AfBf8otcc7HX/2/zfafN0Bc4vNftms/1jLezfksNfb657rY90j/uR7XV5zXeMjnzH0rRh19XI9hgb2ba3keraG8mOw5H7ickpa9vnpKptddqq43baqmn4aDZ4BQ==",
        },
    ],
});
