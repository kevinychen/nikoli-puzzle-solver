import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the board into triminoes (blocks of 3 cells)
    const polyominoes = puzzle.lattice.polyominoes(3, true);
    const grid = new ValueMap(puzzle.points, _ => cs.int(-1, polyominoes.length - 1));

    // Find all placements
    const placements = puzzle.points.placements(polyominoes, false);
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
            answer: "m=edit&p=7VRNb5tAEL3zK6o974HdhdhwS9O4F/cjdaooQpaFbRKjYJPy0VRY/PfMDOvAApFy6cehWjM83s7OPLO8zX+UYRZxF4aacpsLGFJO6XJs/J3GdVwkkf+On5fFLs0AcP5lNuN3YZJHVqCzltax8vzqilcf/YAJxpmES7Alr678Y/XJrxa8WsAU4wK4eZMkAV628IbmEV00pLABf9YY4C3ATZxtkmg1b5ivflBdc4Z93tNqhGyf/oyY1oHPm3S/jpFYhwX8mXwXP+qZvNymDyU7tah5df66XNXKVS9y1bhc+fvlesu6htf+DQSv/AC1f2/htIUL/8ikw3zBmfLo5k6aGz7VKPkIUVC8pTijKCleQxVeKYofKNoUXYpzyrmkeEPxgqJD8YxyJqgDlHZrnJmrmSfh9QnmK848BVAShDtg1dAuQEfTDmBXY/h0hd1gAR+yEBojfyqjWiygpFBtnRMWU8Bep84Je1xIu635gqGO1L0k8rq+RF7XBDMJqetIu4MhX+k6Cngl2nw10Rj6qmknR69VsNbBtb2da3Zl0dnFZudwV2orkI3HcbhvQ0srYIsyuws3EQN/szxNVrl+9sn+nLhDuV9HmUElafqYxAczL74/pFk0OoVktL0fy1+n2bZX/SlMEoPI6TAzqMZ3BlVksfEcZln6ZDD7sNgZRMeARqXoUJgCitCUGD6EvW779j/XFvvF6AoUHJ7q/+H5lw5P3AL7jUfoHzwn/y059PWm2aj1gR5xP7CjLtf8wOjADyyNDYeuBnbE2MD2vQ3U0N5ADhwO3Csmx6p9n6OqvtWx1cDt2Kpr+GBpPQM=",
        },
    ],
});
