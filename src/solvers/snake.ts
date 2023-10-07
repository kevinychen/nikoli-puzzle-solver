import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells into the grid to form a snake
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    const [_, paths] = cs.PathsGrid(puzzle.points);
    const root = cs.enum(puzzle.points);
    cs.addConnected(
        puzzle.points,
        p => Or(grid.get(p).eq(0), root.is(p)),
        (p, q) => paths.get(p).hasDirection(p.directionTo(q))
    );
    cs.add(...Array.from(grid, ([p, arith]) => arith.eq(0).eq(paths.get(p).eq(0))));

    // The snake cannot loop back on itself and visit a cell that's orthogonally or diagonally
    // adjacent to a cell it has visited before
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Implies(And(grid.get(p).eq(1), grid.get(q).eq(1)), paths.get(p).hasDirection(v)));
    }
    for (const vertex of puzzle.points.vertices()) {
        const lines = range(vertex.length).map(i => grid.get(vertex[i]).neq(grid.get(vertex[(i + 1) % vertex.length])));
        cs.add(Sum(...lines).le(2));
    }

    for (const [p, symbol] of puzzle.symbols) {
        if (symbol.isBlack()) {
            // Black circles must lie on one end of the path
            cs.add(paths.get(p).isTerminal());
        } else {
            // White circles must lie somewhere along the path, but not at an end
            cs.add(paths.get(p).isLoopSegment());
        }
    }

    // A number outside the grid represents how many cells in the corresponding row or column are shaded
    for (const [p, v] of puzzle.entrancePoints()) {
        if (puzzle.texts.has(p)) {
            const number = parseInt(puzzle.texts.get(p));
            cs.add(Sum(...puzzle.points.sightLine(p.translate(v), v).map(p => grid.get(p))).eq(number));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Snake",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5swFL7zV1Q++8Cv0pZb1zW7ZNm6ZKoihCIncRtUiDsD6+Qo/3vfeyCBA5O2Q7UeJstPH5/f433GfC5/1EJLHsEILrnLPRh+FNH0wpCm245FVuUyPuPXdbVTGgDnXyYT/iDyUjqJR9Vu6hzMVWzuuPkUJ8xjnPkwPZZycxcfzOfYLLmZwxLjHnDTJskHeNvBe1pHdNOQngt41mKAS4CbTG9yuZo3zNc4MQvOsM8HqkbICvVTslYHPm9Usc6QWIsKNlPusud2pay36qluc730yM11I3c+Ijfo5CJs5CIakYu76MmdvoHcq/R4hM/+DQSv4gS1f+/gZQfn8QHiLD4w/xxLA9DSnA2LfIuANI+Sl5AcXMCaD2r6H5yF4ZCFggmV+RQX0JabgOJHii7Fc4pTyrmleE/xhmJIMaKcCxT+V1vrK38jOUkQkE9wgEv+BKVOwmZ1sZb6bKZ0IXI4xvlOPEsGfmGlyldlrR/EBk6f7AQHDNyeKiwqV+o5z/Z2Xva4V1qOLiEpt49j+WultydvfxF5bhHN9WBRzXlbVKXhJ+09C63Vi8UUotpZRO+Htt4k95UtoBK2RPEkTroV3Z6PDvvFaCYBXEfB/8voH11GeATue/Pte5NDf6/So9YHesT9wI66vOUHRgd+YGlsOHQ1sCPGBvbU20AN7Q3kwOHA/cbk+NZTn6OqU6tjq4HbsVXf8EnqvAI=",
            answer: "m=edit&p=7VRBb5swFL7zKyqffQAMtOXWtc0uWbaOTFWEoshJaIMKcWZgnYj4731+ZiUGJnWHajtMlp+fPz/7fcZ8r/hecZnQABq7oDZ1oLlBgN3xPOx22+ZpmSXhGb2qyp2Q4FD6eTKhDzwrEit2cLe9tI71ZVjf0fpjGBOHUOJCd8iS1nfhsf4U1gtaR7BEqAPYVAe54N527j2uK+9ag44N/qz1wV2Au0nlJktWkUa+hHE9p0Tl+YC7lUty8SMhLQ8134h8nSpgzUu4TLFLD+1KUW3FU0V+pWhofaXpRiN0WUeXvdJl43Rdk+70HeheLpsGPvtXILwKY8X9W+dedG4UHhvF60hcX21lwEW/DQlcA4AwB4MXEMzOYc2l5gcnnjdEYcMEt7lo55CW1gztDVobrY92ijG3aO/RXqP10AYYc66Iw9VOzwgGu2doNWGdIWppO5qnGnw9aNDXM1/PAj0LAj0oUF/99Q6KX2PFjKFAVAve5i2tmMyqfJ3Is5mQOc/g/aIdPyQEhEIKka2KSj7wDTw76ogitscdBpQJccjSvRmXPu6FTEaXFJhsH8fi10Jue6c/8ywzgALrggHphzagUqbGnEspng0k5+XOAE7+ZOOkZF+aBEpuUuRPvJct7+7cWOQnwR4zqEPsfxX6S1VIPYH9R7XotNS8W/34t+jg3yvkqPQBHlE/oKMqb/GB0AEfSFolHKoa0BFhA9rXNkBDeQM4UDhgvxG5OrWvc8WqL3WVaqB2lepU8PHSegE=",
        },
    ],
});
