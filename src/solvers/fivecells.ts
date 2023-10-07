import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into pentominoes (blocks of 5 cells)
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Find all placements
    const placements = puzzle.points.placements(puzzle.lattice.polyominoes(5));
    for (const [p] of grid) {
        cs.add(
            Or(...placements.get(p).map(([placement, _, type]) => And(...placement.map(p => grid.get(p).eq(type)))))
        );
    }

    // A number indicates the amount of edges surrounding the cell which contain a border
    // All borders must be used to divide two blocks, there can not be any dead-ends
    for (const [p, text] of puzzle.texts) {
        cs.add(
            Sum(...puzzle.lattice.edgeSharingPoints(p).map(q => grid.get(q)?.neq(grid.get(p)) || cs.int(1, 1))).eq(
                parseInt(text)
            )
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
    name: "Five Cells",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wI7QJt65rdsmydclUVQhFTkIbVIg7A+vkKP9733umIgYmbYdtPUyOn14+fthfg78uv9VCpTyEFoy5yz1ovj+mPnLx99qWWZWn0Rm/rKudVJBw/mk65fciL1MnbqoS56Ankb7h+kMUM49x5kP3WML1TXTQHyM953oBQ4x7wGamyIf0uk1vaRyzKwM9F/J5k0N6B+kmU5s8Xc0M+RzFeskZrvOOnsaUFfJ7yhod+H8ji3WGYC0q2Ey5y56akbLeyse6qfWSI9eXRu5iQG7QysXUyMVsQC7u4g/LnSTHI7z2LyB4FcWo/Wubjtt0ER0gzqMD8318FL6MZ74N80cIghYEVIF7eQVB55FggsBtwYjAyRyh15kjHHfmOHctAOo80nhHcUrRp7iELXAdUHxP0aUYUpxRzTXFW4pXFEcUz6nmAl/Cb72mvyAn9o3jsIW/liVOzOZ1sU7V2VyqQuQMPMdKma/KWt2LDZwgsiQcEmB7qrRQLuVTnu3tuuxhL1U6OIQw3T4M1a+l2nZmfxZ5bgFzwVjIeMFClYKDfvJfKCWfLVKIameBE1NYM6X7yhZQCVuieBSd1Yp2z0eH/WDU4wAutOD/hfaPLjT8BO5b8+tbk0OnV6pB6wMecD/QQZc3vGd04D1L44J9VwMdMDbQrrcB9e0NsOdwYD8xOc7a9Tmq6lodl+q5HZc6NXycOC8=",
            answer: "m=edit&p=7VRNb5tAEL3zK6I972E/jAvc0jTuxXWb2lUUIcvCNolRwJsu0FRY/PfMLuvAApXaQz8OFWb0/JidfczyJv9aRjLGLlzcwwRTuBjz9D0h6ne+VkmRxsEFviyLg5AAMP44m+H7KM1jJzRZa+dU+UF1g6v3QYgowojBTdEaVzfBqfoQVAtcLeERwhS4eZPEAF638FY/V+iqISkBvDAY4B3AXSJ3abyZN8ynIKxWGKl93urVCqJMfIuR0aH+70S2TRSxjQp4mfyQPJknebkXjyU6b1Hj6rKRuxyRy1u5/FUuH5fLfr9cf13X0PbPIHgThEr7lxZ6LVwGp1rpOiHG1FI4GdqcDWITRfCW4OzcizPBe0u4rwjSEhO/V8OlvRqu16sxJRYB6qjWeKfjTEem4wpeAVdcx3c6Eh1dHec651rHWx2vdJzoONU5b1QToE3dGlN7NaIEPn8Cr85BD2GAuca+C3BiaN7BkE6JwX4Hw1JKG0xVjilJYS01a6kH2DcY8pnJZ6TFKp+ZtYy2mMJezOvkmzrg2RZDPjd6OOSo8+LN+b/2uenhstPzps+qh7UTsmYcqMv9ObR2QrQos20sLxZCZlGKYCCgXKSbvJT30Q4+bz0vsOaOOtOiUiGe0uRo5yUPRyHj0UeKjPcPY/lbIfe96s9RmlpErqefRTVGtahCJtb/SErxbDFZVBwsouNYq1J8LGwBRWRLjB6j3m5Z+861g74jfYccpi3/P23/0rRVR0B+aeb+kdn2b8nRX6+Qo9YHesT9wI663PADowM/sLTacOhqYEeMDWzf20AN7Q3kwOHA/cDkqmrf50pV3+pqq4Hb1VZdw4dr5wU=",
        },
    ],
});
