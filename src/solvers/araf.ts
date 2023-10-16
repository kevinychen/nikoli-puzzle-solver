import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, If, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines over the dotted lines to divide the board into several blocks
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    const instance = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));
    const parent = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));
    const subtreeArea = new ValueMap(puzzle.points, _ => cs.int());
    const area = new ValueMap(puzzle.points, _ => cs.int());
    const tree = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        const neighbors = puzzle.points.edgeSharingPoints(p);
        cs.add(
            Or(
                And(instance.get(p).is(p), parent.get(p).eq(-1), area.get(p).eq(subtreeArea.get(p))),
                ...neighbors.map(q =>
                    And(
                        instance.get(p).eq(instance.get(q)),
                        parent.get(p).is(q),
                        tree.get(q).lt(tree.get(p)),
                        area.get(p).eq(area.get(q))
                    )
                )
            )
        );
        cs.add(
            subtreeArea
                .get(p)
                .eq(Sum(cs.int(1, 1), ...neighbors.map(q => If(parent.get(q).is(p), subtreeArea.get(q), 0))))
        );
    }
    cs.add(...Array.from(grid, ([p, arith]) => arith.eq(instance.get(p))));

    // Each block contains exactly two numbers
    // The size of the block must be between the two numbers, exclusive
    const isRoot = new ValueMap(puzzle.points, p => instance.get(p).is(p));
    for (const [p, arith] of isRoot) {
        if (!puzzle.texts.has(p)) {
            cs.add(Not(arith));
        }
    }
    cs.add(Sum(...isRoot.values()).eq([...puzzle.texts].length / 2));
    for (const [p, text1] of puzzle.texts) {
        const num1 = parseInt(text1);

        const choices = [];
        choices.push(Not(isRoot.get(p)));
        for (const [q, text2] of puzzle.texts) {
            const num2 = parseInt(text2);
            if (num1 < num2) {
                choices.push(And(grid.get(p).eq(grid.get(q)), area.get(p).gt(num1), area.get(p).lt(num2)));
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
    name: "Araf",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wI6QJt65rdsnYumaqKoQiJ6ENKsSdgXVylP+97z2owMCk7bCth8nx0+Pjh/118NfFt0qohPvQvBm3uQPNdWfUJzb+XtsqLbMkOOMXVbmXChLOPy0W/F5kRWJFTVVsHfU80Ndcfwgi5jDOXOgOi7m+Do76Y6BDrm9giHEH2LIuciG9atNbGsfssoaODXnY5JDeQbpN1TZL1suafA4iveIM13lHb2PKcvk9YY0OfN7KfJMi2IgSNlPs06dmpKh28rFqap34xPVFLfdmRK7XysW0lovZiFzcxR+WO49PJ/jbv4DgdRCh9q9tOmvTm+AIMQyOzLXxVfgyTv1tmOsi8DpgguC8BZ6HYNoBcwSTFvg06awDnD6YIvBfAYhxSNIdxQVFl+IKFHPtUXxP0aboU1xSzRXFW4qXFCcUp1Rzjnv+rX/lL8iJ3Npg2Pxfy2IrYmGVbxJ1FkqVi4yBxVghs3VRqXuxhQNDDoQzAexAlQbKpHzK0oNZlz4cpEpGhxAmu4ex+o1Uu97szyLLDFDfJwaqj76BSgXnuvMslJLPBslFuTdAxwPGTMmhNAWUwpQoHkVvtbzd88liPxj1yIP7y/t/f/2j+ws/gf3W/PrW5NDplWrU+oBH3A901OUNHxgd+MDSuODQ1UBHjA20721AQ3sDHDgc2E9MjrP2fY6q+lbHpQZux6W6ho9i6wU=",
            answer: "m=edit&p=7ZRNb5tAEIbv/Ipoz3tgd8EGbmka9+K6TZ0qipBlYZvEKGBSPpoKi//emWUJLFCpPfTjUGFGrx9mZ4dd3s2/lEEWUhsu4VCTMrg4d+Rtmfhrr9uoiEPvgl6WxTHNQFD6YbGgD0Gch4avsjbGuXK96oZW7zyfMEIJh5uRDa1uvHP13qtWtFrDI0IZsGWTxEFed/JOPkd11UBmgl4pDfIe5D7K9nG4XTbko+dXt5TgPG/kaJQkSb+GRPWB//dpsosQ7IICXiY/Rs/qSV4e0qeStFPUtLps2l1PtCu6dsVru2K6Xf7723U3dQ3L/gka3no+9v65k04n1965xr7OhJs4FHaGNXtDOEcgesBCMO+AEAhmPeAisDpgy6JOD7AhmCGwWwDNMNnSvYwLGbmMt9AxrYSMb2U0ZbRlXMqcaxnvZLyS0ZJxJnPm+M6wKv0aM300cTlsFTQpoB1TgLaUtkDbSoMhmNloBvZgKp8h593YVjPUVi/fVdqljKs6HDhXdTjU4b2xreZz0I7SDmhVh0MdoeoIqCPaOlzpZotf17ZZt3VvnZu1xXWrDZ83jsfL/jm1MXyyKpNdmF2s0iwJYgKeJ3kab/Myewj28AXLI4FKdpKZGorT9DmOTnpe9HhKs3DyEcLw8DiVv0uzw6D6SxDHGsjlAaehxosaKrJI+x9kWfqikSQojhromVKrFJ4KvYEi0FsMnoLBbEn3zrVBvhF5+wIOVPH/QP1LBypugflLx+ofOc/+rXbk15tmk9YHPOF+oJMuV3xkdOAjS+OEY1cDnTA20KG3AY3tDXDkcGA/MDlWHfocuxpaHacauR2n6hve3xjfAQ==",
        },
    ],
});
