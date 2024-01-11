import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async (
    { And, Distinct, Implies, Not, Or }: Context,
    puzzle: Puzzle,
    cs: Constraints,
    solution: Solution
) => {
    // Draw a loop that visits every cell
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(arith.eq(0).eq(puzzle.shaded.has(p)));
    }

    // Get all possible line segments in the grid
    const segments = [];
    for (const [line, _, v] of puzzle.points.lines()) {
        for (let i = 0; i < line.length; i++) {
            for (let j = i + 1; j < line.length; j++) {
                segments.push({
                    len: j - i,
                    cells: line.slice(i, j + 1),
                    arith: And(
                        Not(grid.get(line[i]).isStraight()),
                        ...line.slice(i, j).map(p => grid.get(p).hasDirection(v.from(p))),
                        Not(grid.get(line[j]).isStraight())
                    ),
                });
            }
        }
    }

    const maxLength = Math.max(puzzle.height, puzzle.width);
    const regions = puzzle.regions();
    for (const [p, text] of puzzle.texts) {
        // A question mark can replace any number, as long as no number is repeated in that region
        const segmentLens = [...text].map(c => (c === "?" ? cs.int(1, maxLength) : cs.int(parseInt(c), parseInt(c))));
        cs.add(Distinct(...segmentLens));

        // A line segment that overlaps a region must have a length indicated by one of the numbers in that region
        // For segments contained partially in the region, the number still refers to the total length of the segment
        for (const q of regions.get(p)) {
            for (let i = 1; i < maxLength; i++) {
                cs.add(
                    Implies(
                        Or(
                            ...segments
                                .filter(({ len, cells }) => len === i && cells.some(r => r.eq(q)))
                                .map(({ arith }) => arith)
                        ),
                        Or(...segmentLens.map(len => len.eq(i)))
                    )
                );
            }
        }

        // Each number must be represented at least once by a horizontal or vertical segment overlapping the region
        for (const len of segmentLens) {
            for (let i = 1; i < maxLength; i++) {
                cs.add(
                    Implies(
                        len.eq(i),
                        Or(
                            ...segments
                                .filter(
                                    ({ len, cells }) => len === i && cells.some(q => regions.get(q) === regions.get(p))
                                )
                                .map(({ arith }) => arith)
                        )
                    )
                );
            }
        }
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
    name: "Rail Pool",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb9owFH3nV1R+9kNsQwG/VF0He+nYOpiqKopQgLRETXDnJOsUxH/vsRMU8lGt0jStD5PJ1fHxte/JxSfJj8zXAR1giBF1KMPgfGSfvmN+x7EI0yiQZ/QyS7dKA1D6ZTql936UBD23zPJ6+3ws8xuaf5IuYYQSjocRj+Y3cp9/lvmc5nMsEcrAXRdJHHBSwVu7btBVQTIHeAbcL7bdAa5DvY6C5XXBfJVuvqDE1PlgdxtIYvUzIKUOM1+reBUaYuWneJlkGz6VK0m2UY9Zmcu8A80vX5crKrkGFnINasot3+cvyx17hwPa/g2Cl9I12r9XcFTBudyTwTmRDHgGzJk9AH8Qo+gsjhWjYwdKYuAYQlxcHClsZXKPeGfj1EZu4wJVaC5s/GijY+PAxmubM0HZcR8NEkRy3AuH1zGDJIMZLuIRO7iSDDosBu+c5oxLPKaMQ7zBuLhMDAsssFfwCvfLc/iwzIemW6vsysa+jedW8dB07Y19LTr65835rRyXFxY1Y/A25PVcMs/0vb8OcHsmm4fgbKZ07EeYzbJ4FejjHOYliYqWSZktrbdx28DtbGaNipR6isJdPS982CkddC4ZMkD5jvyV0pvG6c9+FNWI4ktVowpT1ahUwzEnc19r9VxjYj/d1ogTd9VOCnZpXUDq1yX6j36jWly986FHfhH7uAJfRvH/y/iPvozmL3Dem4/fmxx7e5XutD7oDveD7XR5ybeMDr5laVOw7WqwHcYG2/Q2qLa9QbYcDu4Vk5tTmz43qppWN6VabjelTg3ver0X",
            answer: "m=edit&p=7VRNb5tAEL37V0R7nsN+sDZwidI06SVNmzpVVSErwg5JULBJATcVFv89M7uLMTaRokpVe6iA1ePN7M7s7rwpf6zjIgGNj/KBg8BHSt98Hqe3fa7TKkvCIzhZVw95gQDg0/k53MVZmYwi5zUbbeogrK+g/hBGTDBgEj/BZlBfhZv6Y1hPoZ6iiYFA7sI6SYRnHfxm7IROLSk44kvEnp32HeEiLRZZcnNhmc9hVF8DozjvzGyCbJn/TJjLg/4X+XKeEjGPK9xM+ZA+OUu5vs0f185XzBqoT15PV3Xpqm26aiBdt58/nG4waxo89i+Y8E0YUe5fO+h3cBpumB6zUDSU3YZJYRbACxKAJ4vLKr89AUdoToQ6Pm4pnCrCTUN7ovHcjNKM1xgFamXG92bkZtRmvDA+Zxg28PCAFAsl1gWXfSyExYJ3mGNJCu4w8nzXJ3A4ACF9i7FwhZpYrHCukh323Dpy4vwbuj7K7NSMnhnHJuMJnRqe6+6Oxu1emORA56fAoMAiko5FEpSzKpBei5SzeqCURQEobpDioOwqmKfzUwo8h/ytFWU5MYjUKbbIWj3RzvAm4PkW+aDdjAC0jaY5aDtXCxg7bgLaztA4w66nA2u1V2frZlsC9nqnO+VgS4AOtBlF0jYTevTb0GwUsem6uIsXCdb52e19cnSZF8s4w7/L9XKeFO0/thlW5tlN6bxD04XAcCvj2aOyPH/K0lXfL71f5UUyaCIywfAD/vO8uN1b/TnOsh5Rmp7ao6z8e1RVpL3/uCjy5x6zjKuHHrHTB3orJauqn0AV91OMH+O9aMtuz82I/WLmixT2cPW/h/+lHk5XwN/Yyfe0+Nvt+A0N8N9Kx1RvXgxKH+kB9SM7qHLHHwgd+QNJU8BDVSM7IGxk97WN1KG8kTxQOHKviJxW3dc5ZbUvdQp1oHYKtSv4aDZ6AQ==",
        },
    ],
});
