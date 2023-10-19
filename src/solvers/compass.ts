import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines over the dotted lines to divide the board into several blocks
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Each block contains exactly one cell with a compass
    const instance = cs.addConnected(
        puzzle.points,
        p => puzzle.symbols.has(p),
        (p, q) => grid.get(p).eq(grid.get(q))
    );
    cs.add(...Array.from(grid, ([p, arith]) => arith.eq(instance.get(p))));

    // A number in a compass indicates how many cells belong to its region that are further in the
    // indicated direction than the compass itself
    for (const [[p, v], text] of puzzle.edgeTexts) {
        cs.add(
            Sum(
                ...[...puzzle.points]
                    .filter(q => p.directionTo(q).dotProduct(v) > 0)
                    .map(q => grid.get(q).eq(grid.get(p)))
            ).eq(parseInt(text))
        );
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
    name: "Compass",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTfb9owEH7nr6j87If8gBLy1nVlL4ytg6mqoggZcEvUBDMnWacg/vfenUPBSSZNk6r1YTI53X13tr8z/pz/KIWWfADDD7jDXRieF9DXd/B3HPOkSGV4wa/KYqM0OJx/GY/5g0hz2Yvqqri3r0ZhdcurT2HEXMaZB5/LYl7dhvvqc1hNeTWDFOMuYBNT5IF7c3LvKI/etQFdB/wp+CMz7R7clcp2Is8N8DWMqjlnuM0Hmowuy9RPyWoaGMOUZYLAUhTQS75JdnUmL9fqqaxr3fjAqyvDdtbB1j+xRdewRa/Jtm6H2CZ6lcrF5A3ojuLDAU79GxBehBFy/35yg5M7C/dgp2TdcM+GlwGuAP8PUIJo9No+REPnPDccYtQ/RlRZ54K+i5F/jPyzymBAueOR3sOmPq7rUm+v/x7zvQ6wj+ya4KA9HRYeU08e2Tk0yyuf7EeyDtkB2QnV3JC9I3tNtk/2kmqGeFx/caCmwzeiE3lGmjgGf+bFvYhNy2wp9cVU6UykcHlmG7GTDETKcpUu8lI/iBXcOdIwXCvAtjTDglKldmmyteuSx63SsjOFoFw/dtUvlV43Vn8WaWoB5kWyIKMeCyo0SOMsFlqrZwvJRLGxgDMZWSvJbWETKIRNUTyJxm7ZqedDj/1i9EU+vID+/xfw37yA+A847022740OXV6lO5UPcIf4Ae0UeY23dA54S9G4YVvUgHboGtCmtAFqqxvAlsAB+43GcdWmzJFVU+m4VUvsuNW53qO49wI=",
            answer: "m=edit&p=7VRNj5swEL3zK1Y++4DtfAC37XbTS5p2m1SrCKHISdgNWgipgW5FxH/v2JiAA5WqSqv2UAGj5+eZ8dj4Tfat4CLEY3iYg21M4KHUUd/Ilm/zrKI8Dr0bfFvkh1QAwPjTbIafeJyFlq+9Autcul75gMsPno8IwojCR1CAywfvXH70ygUulzCFMAFuXjtRgPctfFTzEt3VJLEBLwC7ddga4C5NTjzLauKz55crjOQy71SwhChJv4dIlyHHELKNJLHlOewlO0QnPZMV+/Sl0L4kqHB5W1e7HKiWtdWyS7VsoFq9HVVtJHZxuJm/QbluUFVw6l+g4I3ny9q/ttBp4dI7V7IuaYl3RtOJIzNQVRKM3Mv2YTS1u3PTqRyNmpHbmXNGRI5YM2IdT2dMuke6hkWZzEuw8fcQowPkyBkgx/1wSDxTe6LKrmCzuGTKvlfWVnas7Fz53Cv7qOydsiNlJ8pnKo8LDrSbY2JGI5fBX4aqGdxtmwJmGruYELvGBMREiMYgK9L4sxYTiCU6lkAsbWLBh9IO79SYQk7qagw80/4MeKbXorTFDNZlOg8ImjD4kax7C6rmfOrbse6coTyfyvJp3RPkM/49FFg+WhTJNhQ3i1QkPIZbuzzwU4igO6AsjTdZIZ74Di67ah5YcUcVYVBxmp7i6Gj6Rc/HVISDU5IM989D/ttU7K+yv/I4NohMtUKDqmVrULmIjDEXIn01mITnB4Po6NfIFB5zs4CcmyXyF361WtLuubLQD6Q+n0HrZf9b799pvfIP2H/QgC9ye5v29W+Voy5vKgaVD/SA+IEdFLnmezoHvqdouWBf1MAO6BrYa2kD1Vc3kD2BA/cLjcus1zKXVV0rXS7VE7tcqqt3P7B+Ag==",
        },
    ],
});
