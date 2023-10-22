import { range } from "lodash";
import {
    Constraints,
    Context,
    FullNetwork,
    Point,
    PointSet,
    Puzzle,
    Solution,
    UnionFind,
    ValueMap,
    ValueSet,
} from "../lib";

const solve = async ({ And, Implies, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw paths going through the cells
    // Every unshaded cell must have a line. Shaded cells cannot contain lines
    const network = new FullNetwork(puzzle.lattice);
    const points = new PointSet(
        puzzle.lattice,
        [...puzzle.points].filter(p => !puzzle.shaded.has(p))
    );
    const grid = cs.NetworkGrid(points, network);
    for (const [_, arith] of grid) {
        cs.add(arith.neq(0));
    }

    // Lines cannot go through bold borders
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Not(grid.get(p).hasDirection(p.directionTo(q))));
        }
    }

    // Every figure must overlap exactly one clue
    const figures = [...new Set(puzzle.texts.values())];
    const figureGrid = new ValueMap(points, _ => cs.choice(figures));
    for (const [p, q, v] of points.edges()) {
        cs.add(Implies(grid.get(p).hasDirection(v), figureGrid.get(p).eq(figureGrid.get(q))));
    }
    for (const [p, text] of puzzle.texts) {
        if (grid.has(p)) {
            cs.add(figureGrid.get(p).eq(figures.indexOf(text)));
        }
    }
    cs.addConnected(
        points,
        p => puzzle.texts.has(p),
        (p, q) => grid.get(p).hasDirection(p.directionTo(q))
    );

    // Get all nodes of the figures (points that can't be stretched)
    const nodes = new ValueSet([]);
    for (const [p] of puzzle.lines) {
        const vs = puzzle.lattice.edgeSharingDirections(p).filter(v => puzzle.lines.has([p, p.translate(v)]));
        if (vs.length !== 2 || !vs[1].eq(vs[0].negate())) {
            nodes.add(p);
        }
    }

    // Get which nodes correspond to which figure
    const uf = new UnionFind<Point>();
    for (const [p, q] of puzzle.lines) {
        uf.union(p, q);
    }
    const nodeFigures = new ValueMap<Point, number>([]);
    for (const [p, text] of puzzle.texts) {
        if (!grid.has(p)) {
            for (const node of nodes) {
                if (uf.find(node).eq(uf.find(p))) {
                    nodeFigures.set(node, figures.indexOf(text));
                }
            }
        }
    }

    // Clues indicate the shape of the figure that overlaps it, without rotation or reflection
    const nodeLocations = new ValueMap(points, _ => cs.choice(nodes));
    const nodePositions = new ValueMap(nodes, _ => cs.choice(points));
    for (const [p, arith] of grid) {
        cs.add(And(arith.isLoopSegment(), arith.isStraight()).eq(nodeLocations.get(p).eq(-1)));

        for (const node of nodes) {
            for (const bearing of puzzle.lattice.bearings()) {
                const [q, v] = [bearing.next(node), bearing.from(node)];
                cs.add(
                    Implies(
                        nodeLocations.get(p).is(node),
                        And(
                            arith.hasDirection(v).eq(puzzle.lines.has([node, q])),
                            nodePositions.get(node).is(p),
                            figureGrid.get(p).eq(nodeFigures.get(node))
                        )
                    )
                );

                // The length of each line segment can be expanded or reduced, as long as it is at least 1
                if (puzzle.lines.has([node, q])) {
                    let neighborNode = q;
                    while (!nodes.has(neighborNode)) {
                        neighborNode = bearing.next(neighborNode);
                    }
                    const line = points.lineFrom(p, bearing);
                    const choices = [];
                    for (let i = 1; i < line.length; i++) {
                        choices.push(
                            And(
                                ...range(1, i).map(j => nodeLocations.get(line[j]).eq(-1)),
                                nodeLocations.get(line[i]).is(neighborNode)
                            )
                        );
                    }
                    cs.add(Implies(nodeLocations.get(p).is(node), Or(...choices)));
                }
            }
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Curve Data",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5tMEL37r6j2PAcWsPlxS/PFvbhpU7uKIoQsbJMYBXvTBZoKy/97ZnbxhxeIWqmqmkO1Zvx4s7vzZuFRfKsSmYKHw/HBAo7DsVx1TSz6ncYiK/M0fAcXVbkVEgHAp+kU7pO8SEeRBQ7OceLRoQ7C+gbqD2HEOANm48VZDPVNeKg/hvUc6jmmGHDkZnqSjfCqhbcqT+hSk9xCfN1ghHcI15lc5+lyppnPYVQvgFGd92o1QbYT31PW6KD7tditMiJWSYnNFNvsqckU1UY8Vs1cHh+hvnhdrtPKJajlEhqQS138YblBfDzisX9BwcswIu1fW+i3cB4emO2ykCO+Jjw59aufEHM9IvCBnQjP7hKBsQQ34uEB452KUxVtFRdYE2pHxf9UtFQcqzjD8l4AvsVCG5hvQcAVCjgEWJO4/5Fnga+zng2eo5EDHnZCyAV/rFeMIcCOaJcWuRA0WQcCvQKRTwhFXqEMPvaAj31N3Crtlyq6Kk6UXo9O8BfPWJ/u7xyNVvZTOZHtKrty8If/41GEfmSFyJdFJe+TNb5dyq74AiG3r3arVBpULsRTnu3NednDXsh0MEVkunkYmr8SctPZ/TnJc4PQHx+D0j4xqFKiCc7uEynFs8HsknJrEGeGMXZK96UpoExMiclj0qm2a3s+jtgPpq7o38fub37s6BFYb82Ob02OenuFHLQ+0gPuR3bQ5Q3fMzryPUtTwb6rkR0wNrJdbyPVtzeSPYcj94rJadeuz0lV1+pUqud2KnVu+CgevQA=",
            answer: "m=edit&p=7VTLjpswFN3nKyqv7wI/eJjddNp0kz6mSTWqUBSRhJmgIWEKpFMR8e9zbRMIj1GrSlW7qAg3h3ON77k2x/m3Y5hF4OLFPbCA4sUtoW/HUr/ztYiLJPJfwdWx2KUZAoCP0ynchUkeTQILOI7hy8mplH55A+U7PyCUAGF4U7KE8sY/le/9cg7lHFMEKHIzM4ghfNvCW51X6NqQ1EL8ocYIvyLcxNkmiVYzw3zyg3IBRNV5rd9WkOzT7xGpdajnTbpfx4pYhwU2k+/ixzqTH7fpw5GcS1RQXr0sl7dyeSOXj8tlf16uXFYVLvtnFLzyA6X9Swu9Fs79E2GC+LRS6hA7537NDhHhKoK1hMv6hOy8ghNR/1SpDlWc6sh0XGBNKLmOb3S0dLR1nGF5V4JnEZ8B8SyQVCNJQTLDNci1wDNZl4HLDeLgCoMEeLZ5wwbpmFlaJEDWWQ5SnJGnUKU28USo7QK1PUPcau3XOgodHa3XVSuIa3zZj9N0wmxQa8nxY3eAuwYpP2nEbeDOGYkaNVnhgG3eEC6ImvNASIMkOlAjVGmbrO2BbbJ2nTWdmF1ttsQs9/xie8yWqBarScCEtjoFb/x/OQnQyyRPk1V+zO7CDX6Z2uqgucNxv46yDpWk6WMSH7rj4vtDmkWjKUVG2/ux8es02/ZmfwqTpEPk+uDqUMZjHarI4s5zmGXpU4fZh8WuQ1yYrTNTdCi6AoqwKzF8CHvV9m3P1YT8IPoO/h+Uf/OgVFtg/eJx2bPUb5xyjTV/drL8W3L015tmo9ZHesT9yI66vOYHRkd+YGlVcOhqZEeMjWzf20gN7Y3kwOHIvWByNWvf50pV3+qq1MDtqtSl4fEAfQY=",
        },
    ],
});
