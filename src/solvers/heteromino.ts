import { Constraints, Context, Puzzle, Solution, TransformationType, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the board into triminoes (blocks of 3 cells)
    const polyominoes = puzzle.lattice.polyominoes(3, true);
    const grid = new ValueMap(puzzle.points, _ => cs.int(-1, polyominoes.length - 1));

    // Find all placements
    const placements = puzzle.points.placements(polyominoes, TransformationType.NONE);
    const typeGrid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        cs.add(
            Or(
                puzzle.shaded.has(p),
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(...placement.map(p => And(grid.get(p).eq(instance), typeGrid.get(p).eq(type))))
                    )
            )
        );
    }

    // Two triminoes that share a border must have different shape or different orientation
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Implies(typeGrid.get(p).neq(typeGrid.get(q)), grid.get(p).neq(grid.get(q))));
    }

    // Triminoes cannot use shaded cells
    for (const [p] of puzzle.shaded) {
        cs.add(grid.get(p).eq(-1));
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
    name: "Heteromino",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb9owFH3Pr5j87Id8wAp+67qyF9atg6mqoggZcEvUBHdOsk5G/Pfee5MpOEmlvmzrw2RyOD6+2CfknhQ/KmkUH8OIJtznAYwwnNA18vHzeyzTMlPiHT+vyp02QDj/MpvxO5kVyoubqsQ72Kmw19x+EjELGGchXAFLuL0WB/tZ2AW3C1hiPABtXheFQC9bekPryC5qMfCBXzUc6C3QTWo2mVrNa+WriO2SMzznA/0aKcv1T8UaHzjf6HydorCWJdxMsUsfm5Wi2uqHqqkNkiO35y/bjVq7SGu7yAbs4l38YbvT5HiEv/0bGF6JGL1/b+mkpQtxYOGIiYCzaEpf47P6C2dQcCUOgAHhLeGMMCRcwi7cRoQfCX3CMeGcai4JbwgvCEeE76nmDH280ulfsxOHddPjGL+OJV7MFpW5kxvFoOFZobNV0cwF5QGeEGj7Kl8r40iZ1o9Zunfr0vu9NmpwCUW1vR+qX2uz7ez+JLPMEep0O1LdiI5UGuiyk7k0Rj85Si7LnSOcdKSzk9qXroFSuhblg+yclrf3fPTYL0ZXHMHbJPr/NvlHbxN8BP5bS+pbs0Pdq81g9EEeSD+ogylv9F7QQe9FGg/spxrUgWCD2s02SP14g9hLOGgvhBx37eYcXXWjjkf10o5HnQY+Trxn",
            answer: "m=edit&p=7VTLbptAFN3zFdWsZ8HMQGzYpWncjftI7SqKkGVhm8Qo2KQ8mgqLf++9l3FhgEjZ9LGoBi5nztwXDGfyb2WYRdyFoabc5gKGlFO6HRuv81jGRRL5b/hlWezTDADnn2Yzfh8meWQF2mtlnSrPr2549d4PmGCcSbgFW/Hqxj9VH/xqwasFLDEugJs3ThLgdQtvaR3RVUMKG/BHjQHeAdzG2TaJ1vOG+ewH1ZIzrPOWohGyQ/o9YroPnG/TwyZGYhMW8DL5Pn7SK3m5Sx9Ldi5R8+ry5XZV26761a4ab1f+/na9VV3DZ/8CDa/9AHv/2sJpCxf+iUmH+YIz5dHDnTQPnNXY8gmsIHtHdkZWkl1CFl4psu/I2mRdsnPyuSZ7S/aKrEP2gnwm2Ad02s1xYUYzT8LnE8xXnHkKoCQIT8CqoV2AjqYdwK7G8OsKu8ECfmQhNA9phE4jRIsxVijNyw7GWE/jaQdDrDzn9zoYYqWuJdFH55fI65wSckqdB4TVYvBXOo8CHyVaHzXRGGqpacdHxyqIdTC2t3PNriw6u9jsHO5KbQWy0TgO93VoZQVsUWb34TZioG+Wp8k613Of5M+JO5aHTZQZVJKmT0l8NP3ih2OaRaNLSEa7hzH/TZrtetmfwyQxiJwOM4NqdGdQRRYb8zDL0meDOYTF3iA6AjQyRcfCbKAIzRbDx7BX7dC+c22xH4zuQMHhqf4fnn/p8MQtsF95hP7Bc/Lfaof+3jQblT7QI+oHdlTlmh8IHfiBpLHgUNXAjggb2L62gRrKG8iBwoF7QeSYta9z7KovdSw1UDuW6go+WFk/AQ==",
        },
    ],
});
