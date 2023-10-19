import { isEqual, range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // The loop cannot go through clues
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // Clues represent the numbers of consecutive cells occupied by the loop each time it enters
    // the (up to) eight cells surrounding the clue
    for (const [p, text] of puzzle.texts) {
        // If a ring is drawn around a region, then the "ring direction" is the direction of the loop
        // shape at the cell in that direction. For example, the cell east of a number clue has a ring
        // direction going north, and the cell northeast has a ring direction going west.
        const directions = puzzle.lattice.vertexSharingDirections(p);
        const ringDirections = directions.map(v => {
            const edgeDirections = new ValueMap(
                puzzle.lattice.edgeSharingDirections(p),
                w =>
                    (directions.findIndex(x => x.eq(v.negate())) -
                        directions.findIndex(x => x.eq(w)) +
                        directions.length -
                        1) %
                    directions.length
            );
            return puzzle.lattice
                .edgeSharingDirections(p)
                .reduce((min, v) => (edgeDirections.get(v) < edgeDirections.get(min) ? v : min));
        });

        const neighbors = puzzle.lattice.vertexSharingPoints(p);
        const expectedLoopLens = [...text].map(i => parseInt(i)).sort();
        cs.add(
            Or(
                // 0 = no loop, 1 = continue, 2 = end
                ...range(Math.pow(3, neighbors.length))
                    .map(i => [...i.toString(3).padStart(neighbors.length, "0")].map(c => parseInt(c)))
                    .filter(bitmap => {
                        if (bitmap.every(i => i === 0) && text === "0") {
                            return true;
                        }
                        if (bitmap.every(i => i === 1) && text === bitmap.length.toString()) {
                            return true;
                        }
                        const bits = [...bitmap, ...bitmap];
                        if (range(bits.length - 1).some(i => bits[i] === 1 && bits[i + 1] == 0)) {
                            return false;
                        }
                        const loopLens = range(bitmap.length)
                            .filter(i => bits[i] !== 1 && bits[i + 1] !== 0)
                            .map(i => bits.indexOf(2, i + 1) - i)
                            .sort();
                        return isEqual(loopLens, expectedLoopLens);
                    })
                    .map(bitmap =>
                        And(
                            ...neighbors.map((p, i) => {
                                if (!grid.has(p)) {
                                    return bitmap[i] === 0;
                                }
                                switch (bitmap[i]) {
                                    case 0:
                                        return grid.get(p).eq(0);
                                    case 1:
                                        return grid.get(p).hasDirection(ringDirections[i]);
                                    case 2:
                                        return And(
                                            grid.get(p).neq(0),
                                            Not(grid.get(p).hasDirection(ringDirections[i]))
                                        );
                                }
                            })
                        )
                    )
            )
        );
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
    name: "Tapa-Like Loop",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wK7TllnVNLxlbl0xVhVDkJLRBhbgzsE6O8r/3vQcTMbDDJm3rYbL89Pj4YX8N/rr8WguV8gCad8Ft7kBzg4C64/vU7bYtsypPwzM+raudVJBw/nE24w8iL1MrbqsS66AvQ33L9U0YM4dx5kJ3WML1bXjQH0Idcb2AIcYdYPOmyIX0ukvvaByzqwY6NuQR5H7z2j2km0xt8nQ1b8inMNZLznCdd/Q2pqyQ31LW6sDnjSzWGYK1qGAz5S57bkfKeiuf6rbWSY5cTxu5ixG5XicX00YuZn257X7+sNzL5HiEz/4ZBK/CGLV/6dKLLl2EB4hReGBugK+68GscDt8UJvR9JJ7XkXMXiX0CJlTyA8BUDk14T3FG0aW4hPW49ii+p2hTnFCcU801xTuKVxR9igHVnKPiX9rTX5ATuy4ZpGmT388TK2ZRXaxTdRZJVYicgW1YKfNVWasHsYFDQK6C/wxsT5UGyqV8zrO9WZc97qVKR4cQptvHsfq1VNve7C8izw3Q3BIGao6zgSoFZ/XkWSglXwxSiGpngJNzbcyU7itTQCVMieJJ9FYruj0fLfadUY89uJO8/3fSP7qT8BfYb83Fb00OnV6pRq0PeMT9QEdd3vKB0YEPLI0LDl0NdMTYQPveBjS0N8CBw4H9xOQ4a9/nqKpvdVxq4HZc6tTwcWK9Ag==",
            answer: "m=edit&p=7VRNb5tAEL37V0R7ngOwHyTc0jTuxXWb2lUUIWRhm8QoYFI+mgrL/72zs9gYQw+t1I9DhXb0eDuz+3bgbfGlCvMIFD78Eiyw8XGUomELQcNqnnlcJpF3AddVuclyBAAfxmN4DJMiGvlNVjDa1VdefQf1O89nNgPm4LBZAPWdt6vfe/UU6hlOMbCRm5gkB+FtC+9pXqMbQ9oW4iliYcoeEK7ifJVEi4lhPnp+PQem93lD1RqyNPsasUaHfl9l6TLWxDIs8TDFJn5pZopqnT1XTa4d7KG+NnJnA3J5K5cf5fIBuc15frPcq2C/x7Z/QsELz9faP7fwsoUzb7fXunbMUbrUwU9jA/YUFxRCM5y3jOtoxjohJKUcCFzKpgUfKI4pOhTnuB/UnOJbihZFSXFCObcU7yneUBQUFeW4WjGe6XQNdahG4eBw5nHQiDsGcXCEQQIcaZAEbhB3QJg8LkE0HP7z7gEJZZALwnACK8wegoNskARpaoUCaSqEC9JUSMwzCqQA1SB5yJMuKJOncNasoiQoM4t2o9ljY6YUTYNN82YnzTYN1s3bj3zsgX185K/jYOSzaZUuo/ximuVpmDA0MyuyZFFU+WO4wl+TvA7EbSmzQyVZ9pLE225e/LTN8mhwSpPR+mkof5nl67PVX8Mk6RAF3V0dypisQ5V53HkP8zx77TBpWG46xInbOitF27IroAy7EsPn8Gy3tD3zfsS+MRo+x5uS/78p/9JNqT+B9VP35R+56v4tOfT3Zvmg9ZEecD+ygy5v+J7Rke9ZWm/YdzWyA8ZG9tzbSPXtjWTP4cj9wOR61XOfa1XnVtdb9dyutzo1vB+MvgM=",
        },
    ],
});
