import { zip } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ And, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a square around each given circle
    // All squares must have a circle in the center
    // The square's corners must be located on the grid points
    const centers = [
        ...puzzle.symbols.keys(),
        ...[...puzzle.junctionSymbols.keys()].map(vertex => Point.center(...vertex)),
    ];
    const points = puzzle.points.vertexSet();
    const possibleSquares = new ValueMap<Point, Point[][]>(centers, _ => []);
    for (const center of centers) {
        for (const p of points) {
            if (!p.eq(center)) {
                const v = center.directionTo(p);
                const ws = [v, new Vector(v.dx, -v.dy), new Vector(-v.dy, -v.dx), new Vector(-v.dx, v.dy)];
                const corners = ws.map(w => center.translate(w));
                if (corners.every(corner => points.has(corner) && points.index(corner) >= points.index(p))) {
                    possibleSquares.get(center).push(corners);
                }
            }
        }
    }
    const whichSquares = new ValueMap(centers, center => cs.choice(possibleSquares.get(center)));
    for (const whichSquare of whichSquares.values()) {
        cs.add(whichSquare.neq(-1));
    }

    // Two squares may not intersect or overlap, but they can touch at the corners
    const onLine = (p: Point, side: [Point, Point]) => {
        const v1 = p.directionTo(side[0]);
        const v2 = p.directionTo(side[1]);
        return v1.crossProduct(v2) === 0 && v1.dotProduct(v2) < 0;
    };
    const inSquare = (p: Point, sides: [Point, Point][]) => {
        return sides.every(([p1, p2]) => p1.directionTo(p).crossProduct(p1.directionTo(p2)) < 0);
    };
    const squaresOverlap = (square1: Point[], square2: Point[]) => {
        const sides1 = zip(square1, [...square1.slice(1), square1[0]]);
        const sides2 = zip(square2, [...square2.slice(1), square2[0]]);
        return (
            square1.some(p => sides2.some(side => onLine(p, side))) ||
            square2.some(p => sides1.some(side => onLine(p, side))) ||
            [...square1, Point.center(...square1)].some(p => inSquare(p, sides2)) ||
            [...square2, Point.center(...square2)].some(p => inSquare(p, sides1))
        );
    };
    const centerPairs = centers.flatMap(center1 => centers.map(center2 => [center1, center2]));
    for (const [center1, center2] of centerPairs) {
        for (const square1 of possibleSquares.get(center1)) {
            for (const square2 of possibleSquares.get(center2)) {
                if (square1 !== square2 && squaresOverlap(square1, square2)) {
                    cs.add(Not(And(whichSquares.get(center1).is(square1), whichSquares.get(center2).is(square2))));
                }
            }
        }
    }

    // Squares that share a corner are connected
    // All squares must form one connected group
    const connected = new ValueMap(centerPairs, _ => cs.int(0, 1));
    for (const [center1, center2] of centerPairs) {
        cs.add(
            connected
                .get([center1, center2])
                .eq(1)
                .eq(
                    Or(
                        ...possibleSquares.get(center1).flatMap(square1 =>
                            possibleSquares
                                .get(center2)
                                .filter(square2 => square1.some(p => square2.some(q => q.eq(p))))
                                .map(square2 =>
                                    And(whichSquares.get(center1).is(square1), whichSquares.get(center2).is(square2))
                                )
                        )
                    )
                )
        );
    }
    const root = cs.choice(centers);
    const tree = new ValueMap(centers, _ => cs.int());
    for (const center of centers) {
        cs.add(
            Or(
                root.is(center),
                ...centers.map(otherCenter =>
                    And(connected.get([center, otherCenter]).eq(1), tree.get(otherCenter).lt(tree.get(center)))
                )
            )
        );
    }

    // A number indicates the amount of squares that share a corner with this clue's square
    const numbers = new ValueMap<Point, string>([]);
    for (const [p, text] of puzzle.texts) {
        numbers.set(p, text);
    }
    for (const [junction, text] of puzzle.junctionTexts) {
        numbers.set(Point.center(...junction), text);
    }
    for (const [center, text] of numbers) {
        cs.add(
            Sum(
                ...centers
                    .filter(otherCenter => !otherCenter.eq(center))
                    .map(otherCenter => connected.get([center, otherCenter]))
            ).eq(parseInt(text))
        );
    }

    const model = await cs.solve(whichSquares);

    // Fill in solved squares
    for (const center of centers) {
        const square = possibleSquares.get(center)[model.get(whichSquares.get(center))];
        for (const edge of zip(square, [...square.slice(1), square[0]])) {
            solution.lines.set(edge, true);
        }
    }
};

solverRegistry.push({
    name: "Taj Mahal",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VQ9b9swEN39KwLOHCxKVhNtaZp2cdymdhEYgmDQNhMLkc2UkppChv977o4qLFrs0AJBMxQED0+Pp+Pjx2P5vZZG8RhaeM6HPIAm4ph6EEXUh22b5VWhkjN+WVcbbQBw/nnC72VRqkHaJmWDfXORNLe8+ZSkLGScBdAFy3hzm+ybm6SZ82YKQ4wHwI0BQYIAeH2EdzSO6MqSwRDwxOII4BzgKjerQi1ubKEvSdrMOMN53tPfCNlW/1DM/kbfK71d5kgsZQVrKTf5UztS1mv9WLe5QXbgzaWVO/XIDY9yEVq5iDxycRUdueNXkHuRHQ6w7V9B8CJJUfu3Izw/wmmyhzhJ9iyM8Fc4nQjPB+oFkUBG/GIgL6DsOWQLHBMgp7vjtkaPtYU8dOylR/4isScbxHwkSYLiDNbEm5DiB4pDiiOKY8q5pnhH8YpiRDGmnHe4K3+0b91deSU5qRDkQdtGf4+zQcom9XapzBncOTbdyCfFwJ2s1MWirM29XMFdI/PCdQJuR8kOVWj9VOQ7Ny9/2GmjvENIqvWDL3+pzfqk+rMsCoewb5FD2QvgUJUBS3S+pTH62WG2sto4RMc+TiW1q1wBlXQlykd5Mtv2uObDgP1k1NMQnr7w/9P3j54+PILhWzPyW5NDt1cbr/WB9rgfWK/LW75ndOB7lsYJ+64G1mNsYE+9DVTf3kD2HA7cb0yOVU99jqpOrY5T9dyOU3UNn2aDFw==",
            answer: "m=edit&p=7VTLbtswELzrKwKeeTBJiU50S9O0F8dt6hSBIRiGbCuxENly9WgKGfr3Lpe0ZVrsoQWC9lAIWoyGw+WK5Gz5rY6LhEp4xCUdUAYPlxJf5vv4DszzkFZZEl7Q67pa5wUASj+N6VOclYkXGdHM2zdXYXNPm49hRAShhMHLyYw29+G+uQubKW0mMEQoA24ECAQc4G0HH3FcoRtNsgHgscY+wCnAZVoss2R+pxN9DqPmgRK1zjucrSDZ5N8Toqfh9zLfLFJFLOIK/qVcpzszUtar/KU2WjZraXOty504yhVdueJYrnCXy+1yR29Q7tWsbWHbv0DB8zBStX/t4GUHJ+G+VXXtifCJPh1fnQ/kYz5XDD8woGOonoKaqzFO7R3XOXqsTuSgpZMO3EmkQw3FfMCSOMYH+CfaCIzvMQ4wBhhHqLnF+IjxBqOPUaJmqHYF9u00hzzMJoyBFRj8jIB6GKeMG8xZh5WGM4PBLCLQWARgHGH0vMNKc5grTnhfUBYY3mcdRo3JL5Qhh0YzBI00OOgwaoIu5xGDRhosRYeVRpoaApgrTX4J+Ycmpww6jBo197i5Y4z6rugDmBzuzfGQ1AG0XqQ24vgEf45nXkTG9WaRFBfgJjJZx7uEQN8hZZ7Ny7p4ipfgImxLFLktii0qy/Ndlm5tXfq8zYvEOaTIZPXs0i/yYnWW/TXOMososctalL7aFlUVqfUdF0X+ajGbuFpbxEljsDIl28ouoIrtEuOX+Gy1TffPrUd+EHwjAU1d/G/qf6mpqyMY/FZrP23cb9Yx/61y8PbmhdP6QDvcD6zT5YbvGR34nqXVgn1XA+swNrDn3gaqb28gew4H7hcmV1nPfa6qOre6WqrndrXUqeGjmfcT",
        },
    ],
});
