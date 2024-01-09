import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form regions of unshaded cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded blocks must not form rectangles or squares
    const isRoot = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    cs.addConnected(
        puzzle.points,
        p => isRoot.get(p).eq(1),
        (p, q) => grid.get(p).eq(1).eq(grid.get(q).eq(1))
    );
    for (const [p] of grid) {
        cs.add(
            Implies(
                And(grid.get(p).eq(1), isRoot.get(p).eq(1)),
                Or(
                    ...puzzle.points
                        .vertices()
                        .filter(vertex => vertex.some(q => q.eq(p)))
                        .map(vertex => Sum(...vertex.map(q => grid.get(q).eq(0))).eq(1))
                )
            )
        );
    }

    // All regions must be rectangular in shape
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Sum(...vertex.map(p => grid.get(p).eq(1))).neq(1));
    }

    // A region can have no more than one number
    for (const [p] of puzzle.texts) {
        cs.add(isRoot.get(p).eq(1));
    }

    // A number indicates the size of the region that contains it
    for (const [p, text] of puzzle.texts) {
        cs.addContiguousArea(puzzle.lattice, puzzle.points, p, p => grid.get(p).eq(0), parseInt(text));
    }

    // You cannot shade a cell with a number
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // The shaded cells cannot form a 2x2 square
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Or(...vertex.map(p => grid.get(p).eq(0))));
    }

    // All unshaded rectangles form a diagonally contiguous area
    const tree = new ValueMap(puzzle.points, _ => cs.int());
    const root = cs.choice(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                arith.eq(1),
                root.is(p),
                ...puzzle.points.vertexSharingPoints(p).map(q => And(grid.get(q).eq(0), tree.get(q).lt(tree.get(p))))
            )
        );
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
    name: "Mochinyoro",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5swGL3zV1Q++8CPpEu5pV2zS8bWJVNVIRQ5CW1QIe4MrJOj/O/9vs9UxMCk7bCth8nh6fH8YT/Hfi6/1UKlfAwtmHCXe9B8f0LPyMXfa1tmVZ6GZ3xaVzupgHD+aTbj9yIvUyduqhLnoC9CfcP1hzBmHuPMh8djCdc34UF/DHXE9QK6GPdAm5siH+h1S2+pH9mVET0XeNRwoHdAN5na5OlqbpTPYayXnOE8l/Q1UlbI7ylrfOD7RhbrDIW1qGAx5S57anrKeisf66bWS45cT43dxYDdoLWL1NhFNmAXV/GH7V4kxyP87V/A8CqM0fvXlk5auggPgFF4YIGLn47Ai9kbFvgowFa9CqNJRzinT3BxJMBAHg13Rzgj9AmXMBvXAeF7QpdwTDinmmvCW8IrwhHhOdW8Q7+/taK/YCf2TTiwjX+NJU7MorpYp+oskqoQOYN4sFLmq7JW92IDm03pgf0EbU+VlpRL+ZRne7sue9hLlQ52oZhuH4bq11JtO6M/izy3BHMXWJI5tpZUKTiTJ+9CKflsKYWodpZwcn6tkdJ9ZRuohG1RPIrObEW75qPDfjB64gDunuD/3fOP7h7cAvet5fWt2aHTK9Vg9EEeSD+ogylv9F7QQe9FGifspxrUgWCD2s02SP14g9hLOGg/CTmO2s05uupGHafqpR2nOg18nDgv",
            answer: "m=edit&p=7VRNc5swEL3zKzI66wASODa3NI17cd2mdieTYTwe2SYxE7BSAU0HD/+9qxUOFtCZ9tCPQ0dmd/1W0r4FPeVfSqFiGsDgY+pSDwZjY3x8V/9OY5kUaRxe0Kuy2EsFAaUfplP6INI8dqJm1so5VpOwuqXVuzAiHqGEweORFa1uw2P1PqzmtFpAilAPsJmZxCC8acM7zOvo2oCeC/G8iSG8h3CbqG0ar2cG+RhG1ZISXecNrtYhyeTXmDQ89P+tzDaJBjaigGbyffLcZPJyJ59KcipR0+rK0F0M0OUtXf5Klw/TZb+f7mRV1/DaPwHhdRhp7p/bcNyGi/BYa15Hwl291Acu5tsQzjTAWsAfd4CRe3o5CMBGHm53j3aKlqFdQjVacbRv0bpoA7QznHOD9g7tNVof7QjnXGq+0NH5HqPe6jlaw8JUgAYJg06AIuPG+ei4Z9zYuAk634C+WeBfGmdygckFI+PMukDnXls2beoWaidiRjh6BD8XrZyIzMtsE6uLuVSZSAlIh+QyXeelehBbOAioLIrYAWdaUCrlc5oc7HnJ40GqeDClwXj3ODR/I9Wus/uLSFMLyPGesCBzpC2oUIn1XyglXywkE8XeAs7OtrVTfChsAoWwKYon0amWtT3XDvlG8Ik43Ev8/730l+4l/QncX7qd/sjV8m/RwdMr1aD0AR5QP6CDKm/wntAB70laF+yrGtABYQPa1TZAfXkD2FM4YD8Qud61q3PNqit1Xaqndl3qXPDRyvkO",
        },
    ],
});
