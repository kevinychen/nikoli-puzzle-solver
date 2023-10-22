import { zip } from "lodash";
import { Constraints, Context, Point, PointSet, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Put at most one letter into each cell
    const words = [...puzzle.texts].filter(([p]) => !puzzle.points.has(p)).map(([_, text]) => text);
    const allLetters = [...new Set(words.flatMap(word => [...word]))];
    const expandedPoints = new PointSet(
        puzzle.lattice,
        [...puzzle.points].flatMap(p => puzzle.lattice.edgeSharingPoints(p))
    );
    const grid = new ValueMap(puzzle.points, _ => cs.choice(allLetters));

    // The given words can be read either across (left-to-right) or down (top-to-bottom) in
    // consecutive cells in the grid
    const strips: Point[][] = [];
    for (const p of puzzle.lattice.representativeCells()) {
        const bearing = puzzle.lattice.bearings()[0];
        for (const word of words) {
            // Every word must have either a blank cell or the edge of the grid before and after it
            strips.push(bearing.line(p, word.length + 2));
        }
    }
    const placements = expandedPoints.placements(strips);
    const edges = puzzle.points.edges().map(([p, q]) => [p, q].sort(Point.compare));
    const wordGrid = new ValueMap(edges, _ => cs.int());
    const wordLocation = words.map(_ => cs.int());
    for (const [p, q] of edges) {
        const choices = [wordGrid.get([p, q]).eq(-1)];
        for (const [placement, _, type] of placements.get(p)) {
            if (placement.some(r => r.eq(q))) {
                const wordPosition = placement.slice(1, -1);
                if (wordPosition.some(p => !grid.has(p))) {
                    continue;
                }
                for (const [i, word] of words.entries()) {
                    if (placement.length === word.length + 2) {
                        choices.push(
                            And(
                                grid.get(placement[0])?.eq(-1) || true,
                                grid.get(placement[placement.length - 1])?.eq(-1) || true,
                                ...zip([...word], wordPosition).map(([letter, p]) => grid.get(p).is(letter)),
                                ...zip(wordPosition.slice(0, -1), wordPosition.slice(1)).map(([p, q]) =>
                                    wordGrid.get([p, q]).eq(i)
                                ),
                                wordLocation[i].eq(type)
                            )
                        );
                    }
                }
            }
        }
        cs.add(Or(...choices));
    }

    // Every word must appear in the grid exactly once
    for (let i = 0; i < words.length; i++) {
        cs.add(Or(...[...wordGrid.values()].map(arith => arith.eq(i))));
    }

    // No other words may appear in the grid
    // (that is, if two cells are filled and are adjacent, then there must be a word that uses both of them
    for (const [p, q] of edges) {
        cs.add(Or(grid.get(p).eq(-1), grid.get(q).eq(-1)).eq(wordGrid.get([p, q]).eq(-1)));
    }

    // All letters must be (orthogonally) connected in a single group
    cs.addAllConnected(puzzle.points, p => grid.get(p).neq(-1));

    // Some letters are given
    for (const [p, text] of puzzle.texts) {
        if (grid.has(p)) {
            cs.add(grid.get(p).is(text));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved letters
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value !== -1 && !puzzle.texts.has(p)) {
            solution.texts.set(p, allLetters[value]);
        }
    }
};

solverRegistry.push({
    name: "Scrabble",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZVdb5swFIbv8ysqX/sCA/nijiY0qkSgzce6CqGKpLRFJXHnkHUiyn/v8QEJDOxiF9s6aUIcnTw+tl9w3sPh2zESMWUmZYwaI6pRBld/qFGzP6Bj08RbK69VkqWxdUHtY/bCBSSU+ldX9ClKD3EvKGr6Ye+Uj638luYzKyCMUKLDzUhI81vrlM+t3KP5EoYIZcDcokiH1KnSOxyX2aSATIPcg3xUTLuHdJuIbRo/uAW5sYJ8RYnc5xJny5Ts+PeYlDrk7y3fbRIJNlEGD3N4Sd7KkcPxkb8ey1oWnmluF3KXHXKNSq5MC7kya8otn+c3yx2H5zO89gUIfrACqX1dpaMqXVoniJ51IuZITrXXy9Xi2gZFFF4srNofIEYgj4wMEEwWvr2q141MxPc3i/WyomOktdlM0yWZOf5iVp/OWHMfpmuSXE8c1/amtUoDhbrrr8780l8vZrWhQuzcnjhT31OWH4ybyw9RiEJQ7Nx3p/6X+txRq3KMZHljX3tVna4NG3W6rj4+vGmG7/se4xVGHeMKjoPmBsYpRg1jH6OLNQ7GO4wTjCbGAdYM5YH+0pH/ATkBdBDZP5SraCn/Jgp7AfGOu00sLjwudlFKoLuRA08fDkfxFG3Bq9j8wI7A9lipoJTztzTZq3XJ856LuHNIwvjxuat+w8VjY/X3KE0VULRzBRVdR0GZgJZS+x0Jwd8VsouyFwXU2o+yUrzPVAFZpEqMXqPGbrvqmc898oPgHRjw6TD+fzr+0qdDHoH22brJZ5OD/14uOq0PuMP9QDtdXvKW0YG3LC03bLsaaIexgTa9Dahtb4AthwP7icnlqk2fS1VNq8utWm6XW9UNH4S9Dw==",
            answer: "m=edit&p=7Zbfb6JAEMff/SsanveBXX6IvFG1xkTFirY1xDRoaWuK0kO9XjD+7zc7S8qycA/3cL+SC2GyfJid+e4sk+Xw5RRlMaEmoZQYDtEJhctq68S0bNIxTbz14ppvj0nsXhHvdHxNMxgQ4t/ckOcoOcStUPhYq9Y577j5LckHbqhRjWgMbqqtSH7rnvOxm09IHsArjVBgI+HEYNgvh/f4no+6AlIdxhMYO2LaEoabbbZJ4seRIFM3zOdE43mucTYfarv0a6wVOvjzJt2ttxysoyMs5vC6fS/eHE5P6dup8KWrC8k9ITdokGuUco1PuUaD3GI9v1huZ3W5QNlnIPjRDbn2RTl0ymHgni9c11kzHT7VWwTz2dADRQQKC1EtGzECvmWajaA787257OeYiJfT2SIoacdUZlOdcTLo+7OBPJ1SNQ9lOifDbn/kTXqSp4FCR4uH/vjaX8wG0ishdux1+z1/Uglvd9TwbVYjKHbsj3r+nTzXqXl2kARTbzgp/ZjeVvwYqy4fKk2x3ku0N2gZ2jlsB8kNtD20OloL7Qh9+mjv0XbRmmht9GnzDYUtl2PYtdl8p0UBx/AdFjotBEEJbCz9SAKmMkXUqisBi4OlBHAvphLA8swkgGkXEugoOkTl/RKIwvclgFkeSkB1VTulSHoywTBDmRjKeig1lVSUWrXIuKSJTBw1F3OUNVBDV2cZTCkvNUylNtSw1TimrcaxMPK1TJhSUmph5DuJiM2Vq1H0uEzUzaN2bV1tzD6XCVUjO7a6LsdRIjMdZw1kom470w0lO9PNWhyrFsdW9DDGKj6fHSq6L5C6VXQo775LK4SDkaqX/g+jVQs+pNNuHWdXkzTbRYkGh7Z2SJPHwyl7jjZwBOGZTpDt0bOCkjR9T7b7qt/2ZZ9mceMrDuOnlyb/dZo9KdE/oiSpgAP+pVSQOEwr6JhtK89RlqUfFbKLjq8VIJ2qlUjx/lgVcIyqEqO3SMm2K9d8aWnfNLxDA/6IjP9/RH/oj4hvgf5T/0W/5cz+u+Tg15tmja0PuKH7gTZ2ecFrjQ681tI8Yb2rgTY0NlC1twHV2xtgrcOB/aDJeVS1z7kqtdV5qlq381Ryw4er1nc=",
        },
    ],
});
