import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Distinct, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    // Numbers must be between 1 and N, where N is the width of the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(1, puzzle.width));

    // Each row and column contains exactly one of each number
    for (const [p, v] of puzzle.entrancePoints()) {
        cs.add(Distinct(...puzzle.points.sightLine(p.translate(v), v).map(p => grid.get(p))));
    }

    // An arrow points from a larger number to a smaller number
    for (const [[p, q], symbol] of puzzle.junctionSymbols) {
        const [v] = symbol.getArrows();
        if (v) {
            const [big, small] = p.translate(v).eq(q) ? [p, q] : [q, p];
            cs.add(grid.get(big).gt(grid.get(small)));
        }
    }

    // A number clue indicates the difference between the two adjacent cells
    for (const [[p, q], text] of puzzle.junctionTexts) {
        cs.add(Or(grid.get(p).eq(grid.get(q).add(parseInt(text))), grid.get(q).eq(grid.get(p).add(parseInt(text)))));
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        if (!puzzle.texts.has(p)) {
            solution.texts.set(p, model.get(arith).toString());
        }
    }
};

solverRegistry.push({
    name: "Minarism (Futoshiki)",
    keywords: ["Mainarizumu"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTBctowEL3zFRmddbAMIeBbmqa9ENIUOhnG42EEKMETG1HZbloz/Ht2126NbOXQQ6Y5dIzXj7cr60na5+x7IY3iA7j6I+5xgdcYnnCPBf68+prHeaKCM35Z5FttAHB+O+UPMslUL6yLot6hHAflHS8/ByETjDMfbsEiXt4Fh/ImKBe8nEGKcQHcpCryAV438J7yiK4qUniApzUGuAAY7xQoT+L8V8V9CcJyzhnO9IHGI2Sp/qFYrQT/r3W6ipFYyRxWk23jfZ3Jio1+KupaER15eVkJnjkE9xvBCCvBiByCcR0oeB2bdaKWkzeQO46OR9j4ryB4GYSo/VsDRw2cBQeI0+DAxGCIY+FwRHU8wFz8XjwxUCiofPGnHBL1Im5oEfWYLj0cAO3z9hkxX3iQ6LsS4rWE70qArE8kzqc4h+Xxsk/xI0WP4jnFCdVcU7yneEVxQHFINRe4QX+1haf780ZyQjGq7MjP3c+oF7Jpka6UOZtqk8oEmmO2lXvFwIcs08kyK8yDXENPkU2hbYDb0QiLSrTeJ7DFFhk/7rRRzhSSavPoql9ps2m9/VkmiUVU3xyLqjrIonIDrX/yXxqjny0mlfnWIk5sYr1J7XJbQC5tifJJtmZLmzUfe+wnoxs60QOf///I/auPHB6C9958+t7kUP9q4zQ/0A7/A+v0ec13rA58x9Q4YdfXwDqsDWzb3UB1DQ5kx+PAvWJzfGvb6aiqbXacquN3nOrU8mHUewE=",
            answer: "m=edit&p=7VTBcpswEL37KzI664AAY5tbmqa9OG5Tu5PxMB6PbJOYCViugKbFw79ntWCwBDn0kGkPHcx6ebuSnlZ6m/7IuQypC48zphZl6plY+E6Y+ln1s4iyOPSv6HWe7YUEh9IvM/rI4zQcBHXSanAqJn5xT4vPfkAYocSGl5EVLe79U3HnF0tazCFEKANsWiXZ4N627gPGlXdTgcwCf1b74C7BjQ4hMI+j7HeFffWDYkGJWukDjlcuScTPkNRM1PdWJJtIARuewW7SfXSsI2m+E885OS9S0uK6IjzvIey0hJ2GsNNP2K4JbyO5jcP19B3oTlZlCYX/BoTXfqC4f2/dcevO/VOpeJ0Icz01Fg6HVccDyOi8eUQgkWH6skmHQL2JO9xEPaYLey7ANjXPiNjMgoDTF2BvBey+AND6hORstAvYHi0ctB/RWmiHaKeYc4v2Ae0NWhethzkjVSAo4eUcXmc0Vm6syuTCuZ4LN1GA0wK2VZe2AVhd2QbwzIyRMak9NoeYqziukeEMjUkdzxxiruLaRobrGJO6rjlEX6W5JVXB5+cb0xyKKng5CNi4aix02P+/GgRkliebUF7NhEx4DNd8vufHkEBHIamI12kuH/kW1IENhyJ2wBEaFAtxjOGyaGD0dBAy7A0pMNw99eVvhNwZs7/wONaAFLunBlVa0KBMRto3l1K8aEjCs70GXAhemyk8ZDqBjOsU+TM3VkvaPZcD8ovgC5qyoGP9b9d/q12rQ7D+qGlfduR3a4D/Fh28v0L2ih/gHv0D2qvzGu9IHfCOqNWCXV0D2iNtQE11A9QVOIAdjQP2hszVrKbSFStT7Gqpjt7VUpeSD1aDVw==",
        },
    ],
});
