import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded cells cannot be horizontally or vertically adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
    }

    // A row or column may not contain two unshaded cells with identical numbers
    for (const [p, v] of puzzle.points.entrances()) {
        for (let i = 1; i <= puzzle.width; i++) {
            cs.add(
                Sum(
                    ...puzzle.points
                        .sightLine(p.translate(v), v)
                        .filter(q => parseInt(puzzle.texts.get(q)) === i)
                        .map(q => grid.get(q).eq(0))
                ).lt(2)
            );
        }
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
    name: "Hitori",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRBb5swFL7nV1Q++wAY0pRb1zW7dNm6ZqoqhCInoQ0qxJ2BdSLKf+97D9IYw6TtsK2HyeHp5ePZ32fs7xXfKqkTHsAQE+5wF4bnTejxHfwdxjwtsyQ84edVuVEaEs4/Taf8XmZFMoraqni0q8/C+prXH8KIuYwzDx6Xxby+Dnf1x7Ce8foGXjHuAnbVFHmQXjbpxIH8lgoQvWhQF9FZm0N6B+kq1assWVw1yOcwquecIdE7mo0py9X3hLVC8P9K5csUgaUsYTfFJn1q3xTVWj1Wba0b73l93ui9GdArjnoxbeRiNiAXd/GH5Z7F+z189y8geBFGqP3rMZ0c05twB3EW7pjn4NQAtDSHwzzXBjwEfAMQh49zAHx7yplVIYhFGACxGIsKm0UQC9yZV2BisQhiMab4NotPLMYaPrEYa/inNkAs5hR7L4HNEthfLBjbFcRiKA1slsDey5hYXmnhtFw6szuKU4oexTkcKa8FxfcUHYoBxSuquaR4S/GCok9xTDWneCl+69r8BTmR17QgHMGvZfEoYrMqXyb6ZKZ0LjMGTYgVKlsUlb6XK3AU9SgwDWBbquxAmVJPWbrt1qUPW6WTwVcIJuuHofql0mtr9WeZZR2g6bgdqOkNHajUYHzjv9RaPXeQXJabDmA0ic5KybbsCihlV6J8lBZbftzzfsR+MHoiAR1e/O/w/6rD4xk4b82wb00OXV+lB70P8ID9AR20eYv3nA54z9NI2Lc1oAPOBtQ2N0B9fwPYszhgP3E5rmobHVXZXkeqnt2RynR8FI9eAA==",
            answer: "m=edit&p=7VRNb5tAEL3zK6I974Flwcbc0jTuxXWbOlUUIcvCNolRwJsu0FRY/u+dncUxu1CpPfTjUGFG48fsvrcfb8ovdSJTGsDDQ+pSBo/nhfj6rvqdntusytPogl7W1U5ISCj9MJ3ShyQvUyduq5bOoZlEzQ1t3kUxYYQSD15GlrS5iQ7N+6iZ02YBnwhlgM10kQfptU5DF/I7LFDolUaZQudtDuk9pJtMbvJ0NdPIxyhubilRRG9wtEpJIb6mpBWi/m9Esc4UsE4qWE25y57bL2W9FU81OVEcaXOp9S4G9PKzXv4qlw/L9X6/3MnyeIR9/wSCV1GstH8+p+E5XUSHo9J1IJ6rhgagRR8O8ZgNeArwOwA/bc4J8O0hE6uCIwvvAMyalNssHFm8DhBaLHxiDfFtFp9Zc/ieNYc/toHQHmKvJbBZAnvHgpFdMbaUBjZLYK9l5Bq0cFoMz+we4xSjh/EWjpQ2HONbjC7GAOMMa64x3mG8wuhjHGHNWF0KuDbdOUa90XOMWoVmWLT3h+krwPSxMn0yTO8203vM9BLZ6wq0aqXo6MSe7jbqCX4uWzoxmdfFOpUXcyGLJCfQb0gp8lVZy4dkA+bBdkQR22OlAeVCPOfZ3qzLHvdCpoOfFJhuH4fq10Jurdlfkjw3gBKbqwHpNmBAlcyM/4mU4sVAiqTaGUCnHxgzpfvKFFAlpsTkKbHYivOajw75RvCNOTRz/r+Z/61mrs7A/aWW/kdaxb8lB6+vkIPeB3jA/oAO2rzFe04HvOdpRdi3NaADzgbUNjdAfX8D2LM4YD9wuZrVNrpSZXtdUfXsrqi6jo+Xznc=",
        },
    ],
});
