import { range } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines over the dotted lines to divide the board into rectangles
    const grid = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));

    // Each rectangle contains exactly one black circle
    // A number indicates the size of the rectangle, in cells
    for (const [p, text] of puzzle.texts) {
        const area = parseInt(text);
        const choices = [];
        for (let h = 1; h <= area; h++) {
            if (area % h === 0) {
                const w = area / h;
                for (let row = p.y - h + 1; row <= p.y; row++) {
                    for (let col = p.x - w + 1; col <= p.x; col++) {
                        const points = range(row, row + h).flatMap(y => range(col, col + w).map(x => new Point(y, x)));
                        if (points.every(q => q.eq(p) || (puzzle.points.has(q) && !puzzle.texts.has(q)))) {
                            choices.push(And(...points.map(q => grid.get(q).is(p))));
                        }
                    }
                }
            }
        }
        cs.add(Or(...choices));
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
    name: "Shikaku",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wc025dV2zS5qtS6aqQihyEtqgQtwZWCdH+d/73oMIDEzaDtt6mByeXj5+tr8Gf118q4RKeADNm3CbO9Bcd0KPb+Pv1JZpmSXhGb+syp1UkHD+aTrlDyIrEitqqmLroC9Cfcv1xzBiLuP0OCzm+jY86JtQz7leQBfjPrAZZA7jLqTXbXpH/Zhd1dCxIZ83OaT3kG5StcmS1awmn8NILznDdd7TaExZLr8nrB5G/zcyX6cI1qKEzRS79LnpKaqtfKqaWic+cn1Zy12c5OIqjVyvlYtpLRezEbm4iz8s9yI+HuG1fwHBqzBC7V/bdNKmi/AAcR4emGvjUB+01N+GuR4C+FQn4FFFF7gIvA6gIZ05fBrSqfAnvTmCcwTBCYAYhyTdU5xSdCkuQTHXHsUPFG2KAcUZ1VxTvKN4RdGn+I5qznHPv/VW/oKcyK0Nhi34tSy2Ijav8nWizuZS5SJjYDFWyGxVVOpBbODAkAPhTADbU6WBMimfs3Rv1qWPe6mS0S6EyfZxrH4t1bY3+4vIMgPU94mB6qNvoFLBue78F0rJF4PkotwZoOMBY6ZkX5oCSmFKFE+it1re7vlosR+MnsiD+8v7f3/9o/sLP4H91vz61uTQ6ZVq1PqAR9wPdNTlDR8YHfjA0rjg0NVAR4wNtO9tQEN7Axw4HNhPTI6z9n2OqvpWx6UGbseluoaPYusV",
            answer: "m=edit&p=7VRNb5tAEL3zK6I974HdhdhwS9O4F9dt6lRRhCwL2yRGAW/KR1Nh+b93dhYMC1RqD/04VJjx4zEz+2B5k38pwyyiLhxiSm3K4OB8iqdjq19z3MVFEvkX9Kos9jIDQOmH2Yw+hkkeWUGdtbKOledXt7R65weEE4onIyta3frH6r1fLWi1hFuEOsDNATFCOcCbFt7jfYWuNclswIsaA3wAuI2zbRKt55r56AfVHSVqnTdYrSBJ5deI6DK83sp0EytiExbwMPk+fqnv5OVOPpekWeJEqystd9nIZa1c0coVZ7liXC7//XK91ekEr/0TCF77gdL+uYXTFi7940npOhJuq1IHtOi9IVwQvV0NIew+wRUhOoTo9XDsXoYz7fVwJ4pwGwLEMJT0gHGGkWO8A8W0EhjfYrQxuhjnmHOD8R7jNUYH4yXmTNQzw1vp9rg0q4nHYasY8QUlngDIEcI/YFFjxTs6xT1DqKKM2RozMA1jbekZQylrWjqARSffqzH04U0fqOV1LYNaXtfyCeBpzXstBoMyXvfhdgdDjqh7ctZiATmi7s95i4XKUWvpj+O8K/qNLzs7pHdFvfGTFXA9K9Th/hxaWQFZlOkmyi4WMkvDhMC0ILlM1nmZPYZb+PZxmFDkDphpUImUL0l8MPPip4PMotFbiox2T2P5G5ntet1fwyQxiBxHo0FpFxtUkcXGdZhl8tVg0rDYG0THzkan6FCYAorQlBg+h73V0vaZTxb5RvAMBIxi8X8U/6VRrLbA/qWB/Ecm4b8lB79emY1aH+gR9wM76vKaHxgd+IGl1YJDVwM7Ymxg+94GamhvIAcOB+4HJldd+z5XqvpWV0sN3K6W6ho+WFnfAQ==",
        },
    ],
});
