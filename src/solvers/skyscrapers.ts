import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Distinct, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    // Numbers must be between 1 and N, where N is the width of the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(1, puzzle.width));

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        if (puzzle.points.has(p)) {
            cs.add(grid.get(p).eq(parseInt(text)));
        }
    }

    // Each row and column contains exactly one of each number
    for (const [line] of puzzle.points.lines()) {
        cs.add(Distinct(...line.map(p => grid.get(p))));
    }

    // Every number inside the grid represents a building, with a height equal to the number. A
    // clue outside the grid represents how many buildings can be seen in the corresponding row or
    // column from that direction, where higher buildings hide all lower buildings behind it
    for (const [line, p] of puzzle.points.lines()) {
        if (puzzle.texts.has(p)) {
            const number = parseInt(puzzle.texts.get(p));
            cs.add(
                Sum(...line.map((q, i) => And(...line.slice(0, i).map(r => grid.get(r).lt(grid.get(q)))))).eq(number)
            );
        }
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
    name: "Skyscrapers",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRLb9s8ELz7VwQ88yCZfuqWpnEvrtvULoJAEAzaVmIhkplSUlPQ8H/P7kqpTEoF2sPXL4eC4mI0XJLDxzD/Vkod8zEUMeEe96EIb0B15OH3WlZJkcbBBb8si73SADj/NJvxe5nmcS/EflCi3tFMA3PDzYcgZD7jrA/VZxE3N8HRfAzMgpslNDHI5WZeJfUBXjfwltoRXVWk7wFe1BjgHcBtordpvJ5XzOcgNCvOcJ531Bshy9T3mNU68H+rsk2CxEYWsJh8nzzVLXm5U49lnetHJ24uK7nLDrmikYuwkouoQy6u4j+WO41OJ9j2LyB4HYSo/WsDJw1cBkeIi+DI+kPsKkBLdTZMuMRg5BBDDwk4zJ9E/3W3amIknIzx1CEmlHE26NTtMrV1gFyfRN9RnFHsU1zBmrgRFN9T9CgOKc4p55riLcUrigOKI8oZ46780b79BTmhGFVGgjL+PRT1QrYos02sLxZKZzJlYEKWq3Sdl/pebuFKkUfh1gB3oEyLSpV6SpODnZc8HJSOO5uQjHcPXfkbpXfO6M8yTS2ienEsqjKHRRUabv7Zv9RaPVtMJou9RZy5xBopPhS2gELaEuWjdGbLmjWfeuwHoxoKeAXFvxfuf3rh8Ai8t+bXtyaHbq/SndYHusP9wHa6vOZbRge+ZWmcsO1qYDuMDazrbaDa9gay5XDgfmFyHNX1OapyrY5TtdyOU50bPox6Lw==",
            answer: "m=edit&p=7ZVNb5tAEIbv/hXRnvcALN+3NI17cd2mdhVFyLKwTWIUbNIFmgrL/72zAzbegUrtoR+HCjMaP8zOvLvLLMWXKpYJ9+ASPje4CZcwbLxdQ/1O1zwtsyS84tdVuc0lOJx/GI/5Y5wVySgycaS5GB3qIKzveP0ujJjJOLPgNtmC13fhoX4f1lNez+ARg1heT5ogC9zbzr3H58q7aaBpgD9tfXAfwF2ncp0ly0lDPoZRPedM1XmDo5XLdvnXhLU61P91vlulCqziEiZTbNOX9klRbfLnip1KHHl93cidDcgVnVxxliuG5Vq/X26wOB5h2T+B4GUYKe2fO9fv3Fl4OCpdB2Y5aqgALc3eMEGB7RLgGApYF8A6rVYLXEEivIAAX5CkAR0S6DpAromiH9CO0Vpo5zAnXgu0b9EaaB20E4y5RXuP9gatjdbFGE+tCqzbZQ63N1otl3DbqVqn5fIUsC+A307kDHDuTgdso53ZGXgU+KSKHZAqjkmSOj4FAdHh0rKuSaq4Fqni0hwezeFRHR7N4QlSxTdIhE9z+BYdYms6zu9Cs8+zi/eieRfUPh9HkXB5exbBkfZT3mIUsWm1WyXyaprLXZwxOMVYkWfLopKP8Rp6Eg85jmyPkRrK8vwlS/d6XPq0z2Uy+EjBZPM0FL/K5YZkf42zTAMFHtkaak4XDZUy1f7HUuavGtnF5VYDF8eMlinZl7qAMtYlxs8xqbbr5nwcsW8M70jAZ0T8/0T8pU+E2gLjlz4Uf+T8/bfk4Nuby8HWBzzQ/UAHu7zlvUYH3mtpVbDf1UAHGhso7W1A/fYG2OtwYD9ocpWV9rlSRVtdlep1uyp12fDRYvQd",
        },
    ],
});
