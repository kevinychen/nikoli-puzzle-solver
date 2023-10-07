import { Constraints, Context, Point, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place pentominoes into the grid
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Shapes can be rotated or mirrored
    // A shape can be used no more than once
    // There cannot be shapes in the grid that aren't present in the bank
    const polyominoes = puzzle.lattice.polyominoes(5);
    const placements = puzzle.points.placements(polyominoes);
    const shapeLocation = new Map(polyominoes.map(polyomino => [polyomino, cs.int()]));
    for (const [p] of grid) {
        cs.add(
            Or(
                grid.get(p).eq(-1),
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(
                            ...placement.map(p => grid.get(p).eq(instance)),
                            shapeLocation.get(polyominoes[instance]).eq(type)
                        )
                    )
            )
        );
    }

    // Two shapes cannot be orthogonally or diagonally adjacent
    for (const [p] of grid) {
        for (const q of puzzle.points.vertexSharingPoints(p)) {
            cs.add(Or(grid.get(p).eq(-1), grid.get(q).eq(-1), grid.get(p).eq(grid.get(q))));
        }
    }

    // Arrows point towards the shape closest to the clue
    // If a clue has multiple arrows, the distance to the closest shape must be the same
    // Directions without an arrow must have a shape further away, or not have a shape in that direction
    for (const [p, symbol] of puzzle.symbols) {
        const arrows = symbol.getArrows();
        const lines = puzzle.lattice
            .edgeSharingDirections()
            .map(v => [v, puzzle.points.sightLine(p.translate(v), v)] as [Vector, Point[]]);
        const choices = [];
        for (let i = 0; i <= Math.min(...lines.map(([_, line]) => line.length)); i++) {
            choices.push(
                And(
                    ...lines.flatMap(([v, line]) =>
                        line.slice(0, i + 1).map((q, j) =>
                            grid
                                .get(q)
                                .neq(-1)
                                .eq(arrows.some(w => w.eq(v)) && j === i)
                        )
                    )
                )
            );
        }
        cs.add(Or(...choices));
    }

    // A cell with a clue cannot overlap a shape
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).eq(-1));
    }

    const model = await cs.solve(grid);

    // Fill in solved shapes
    for (const [p, arith] of grid) {
        if (model.get(arith) !== -1) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Pentopia",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRRb9o8FH3nV0x+9kNCoEDeuq7shXXrYKpQFCEDbokaMJ+TfJ2M+O+99zoVOHE1aVq1PkxOrm6Oj66PnXtc/FcJLfkARjTkAQ9hREGP3osAn5cxy8pcxh/4ZVVulIaE86/jMb8XeSE7Sc1KOwczis0tN5/jhIWMsy68IUu5uY0P5kts5txMYYrxELCJJXUhvT6ldzSP2ZUFwwDymzqHdA6p0Fo9LVZaFYUFv8WJmXGGS32kApiyrfpfsloKfq/UdpkhsBQl7KfYZPt6pqjW6rGquWF65ObSKp56FEcnxZhaxZh5FONGUPEq06tcLiZvIHeUHo9w8t9B8CJOUPuPUzo8pdP4APGGYkhxHh9YbwRlktD+fSjdPFrWD5CAPxhIXsLQEqiGl0BL2PbyVhhEv6gwJMKrImErY9pQl+IM9stNRPETxYBin+KEONcU7yheUexRvCDOAE/st8/0jeQk3R4d4cvo//mvtJOw6UbsJQMvs0Lli6LS92IFbUlWh84DbFdtl1I7UK7UPs92Li972CktvVMIyvWDj79Uet2o/iTy3AHsxeVA1mAOVGpwz9k3dY2DbEW5cYAzpzmV5K50BZTClSgeRWO17WnPxw77yehNIujh6N9F+fcuSvwLwXuz9nuTQw2stNf9AHsuAEC9Rq/xltcBb7kaF2wbG1CPtwFt2hugtsMBbJkcsFd8jlWbVkdVTbfjUi3D41Lnnk/SzjM=",
            answer: "m=edit&p=7VTdb5swEH/nr5j87AfAJAHeuq7ZS/bRJVMVoShyEtqgkjgzsE5E/O89n0mJga5StWp7mBzuzj9f7s4fv8t+FFzGdASD+dSmDgxme/gNbfU7jVmSp3H4jl4U+VZIMCj9Mh7TW55msRXVXgvrWAZheU3Lj2FEHEKJC59DFrS8Do/lp7Cc03IKS4Q6gE20kwvmVWPe4LqyLjXo2GB/rm0w52ByKcXDci1FlmnwaxiVM0pUqvcYQJlkJ37GpC5Fzddit0oUsOI57CfbJod6JSs24r4gpywVLS90xdOeillTMXuqmPVX7NYVrxO5TuPl5A3KDRZVBSf/DQpehpGq/Xtj+o05DY+VqktJB+U8PBIvgDCRo28fQrePlgxs5WCjg93r4GsHjNHrEJwcnokwYi9E8Nlvi4StjHFDLsoZ7JeWDOUHlDbKAcoJ+lyhvEF5idJDOUSfkToxONPzGMPOv8+PUmeAIybugIQOPP0hKmZrpUGmQc/RSs8GLqphrZhWPqpRgMrXUXzt4nuoAg0GOlig/xfUayqfvuGnA1GbrazI9fAiTmPw52cLKyLTLT/EBDoCyUS6zAp5y9fwuLFhUMT2xW4VSwNKhTikyd70S+72Qsa9SwqMN3d9/ishN63oDzxNDSDD9mdAmqYGlMvEmOPbM5Adz7cGcMZXI1K8z80Ccm6WyO95K9uu2XNlkV8Ev4gBE9j/dvv32q26BfvVTffN+tW/VQ4+YCF72Q9wTwMAtJfoNd7hOuAdVquEXWID2sNtQNv0BqjLcAA7JAfsGZ6rqG2qq6rabFepOoRXqc45Hy2sRw==",
        },
    ],
});
