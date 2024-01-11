import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Iff, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions, where each region represents a snake
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    const [_, paths, order] = cs.PathsGrid(puzzle.points);
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Iff(grid.get(p).eq(grid.get(q)), paths.get(p).hasDirection(v)));
    }

    // A snake is a path that is at least 2 cells long
    for (const [p, arith] of grid) {
        cs.add(Or(...puzzle.points.edgeSharingPoints(p).map(q => grid.get(q).eq(arith))));
    }

    // A snake cannot loop back on itself and visit a cell that's orthogonally or diagonally
    // adjacent to a cell it has visited before
    for (const vertex of puzzle.points.vertices()) {
        for (const p of vertex) {
            const lines = range(vertex.length).map(i =>
                grid
                    .get(vertex[i])
                    .eq(grid.get(p))
                    .neq(grid.get(vertex[(i + 1) % vertex.length]).eq(grid.get(p)))
            );
            cs.add(Sum(...lines).le(2));
        }
    }

    // A number indicates the length of the snake, in cells
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                arith.eq(order.get(p).add(1)),
                ...puzzle.points
                    .edgeSharingPoints(p)
                    .map(q => And(arith.eq(grid.get(q)), order.get(q).eq(order.get(p).add(1))))
            )
        );
    }
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // A circle indicates an endpoint of a snake
    for (const [p] of puzzle.symbols) {
        cs.add(paths.get(p).isTerminal());
    }

    // A gray cell must not be on the endpoints of a snake
    for (const [p] of puzzle.shaded) {
        cs.add(paths.get(p).isLoopSegment());
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
    name: "Snake Pit",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5swFL7zV1Q++8CP0Kbcuq7ZJcvWJVNVIRQ5idugQtwZWCei/O9975k2GJjWS7UdJoeXx+f347PN5+JHJbTkIYxgzF3uwfD9MT0jF38vY5GWmYxO+EVVbpUGh/Mvkwm/E1khnbiJSpx9fR7V17z+FMXMZ5wejyW8vo729eeonvN6DlOMB4BNwfMY98G9Oro3NI/epQE9F/xZ44N7C+461etMLqcG+RrF9YIz7POBstFlufopmUmj97XKVykCK1HCYopt+tjMFNVGPVRNrJcceH3RoYtdGrrIvKGLrqGL3gBdXMU70z1PDgfY9m9AeBnFyP370R0f3Xm0Z77LooCzwKe/0Zj+wjP4g4AZBgRYdQQ0zbGxADJiFrQAyI1ZeARG3Qgsa9UIKaKVgh1bEdDbi/Zgb18YAG7tGDvFEh0UEiaU5pNdwDJ5HZD9SNYlG5KdUswV2Ruyl2RHZE8p5gw3CrayXcPMtLNhm14Jmw6ws4b8KwvTwXT+w8EcnNg3usMRvs1LnJjNK30n1hI+iVmVr6Q+mSmdiwze51vxKBlokRUqWxZNXERShY8HsB1lWFCm1GOW7uy49H6ntBycQlBu7ofiV0pvOtWfRJZZgLl4LMicrQWVGgTQehdaqycLyUW5tYCWWKxKclfaBEphUxQPotMtP6754LBfjJ44gIsu+H/R/aWLDo/AfeN11xGrEej7XBn/Fh36epUelD7AA+oHdFDlDd4TOuA9SWPDvqoBHRA2oF1tA9SXN4A9hQP2G5Fj1a7OkVVX6tiqp3Zs1RZ8nDjP",
            answer: "m=edit&p=7VRNb5tAEL3zK6I974HdxV/c0jTuxXWbOlVUIcvCNolRsHH5aCos/ntmhrVhgUq5RO2hwp59PGZmh1nepD9zPwn4AC415jYXcEk5pr9j4+983YdZFLhX/DrPdnECgPMv0yl/9KM0sDzttbROxcQt7njxyfWYZJz+gi15ceeeis9useDFAh4xroCbARKMS4C3NXyg54huKlLYgOcaA/wBcBMmmyhYzSrmq+sV95zhPh8oGiHbx78CVoXR/Sber0Mk1n4GL5PuwqN+kubb+Dln5y1KXly3yhV1uaouV13KVf3lyvcvd7IsS2j7Nyh45XpY+/cajmu4cE9M2sxVnClJizOmZTCCpcSSwUFhVgfKrI6NKRsJ1SAkEoOacNoemNbIMbBbIbhjwwP2Fu6pxE7pCoA3OsaGdpeFgCmFSbL38Jq8UGQ/krXJDsjOyOeW7APZG7IO2SH5jLBR0MpmjqEZzYQNErGr/sEKWBGeOBcIK2BHY3AXdu0uRIUF8uc0ECt0rAANionGEy70icEK+BwrGxj2kjqPRF7nkSPA40YejSVgdc4paqwgv9I5FfKy4T++fCCXo6p6uzgf26X/2NvS8mQ1SvAavA0tLY8t8uTR3wTwlc/z/TpIruZxsvcjuF/s/GPAYLywNI5WqfZzafpw4g4UYVBRHB+j8GD6hU+HOAl6HyEZbJ/6/Ndxsm1lf/GjyCBSmqUGVX2uBpUloXHvJ0n8YjB7P9sZREP/RqbgkJkFZL5Zov/st3bb1+9cWuw3o7+nYHar/7P7L81uPAL7jRO8pcJKee8zBf+tcujrjZNe6QPdo35ge1Wu+Y7Qge9IGjfsqhrYHmED29Y2UF15A9lROHB/EDlmbescq2pLHbfqqB23agreW1qv",
        },
    ],
});
