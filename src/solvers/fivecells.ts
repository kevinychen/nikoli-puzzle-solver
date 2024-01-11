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
    name: "Five Cells (Palisade)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wI7QJt65rdsmydclUVQhFTkIbVIg7A+vkKP9733umIgYmbYdtPUyOn14+fthfg78uv9VCpTyEFoy5yz1ovj+mPnLx99qWWZWn0Rm/rKudVJBw/mk65fciL1MnbqoS56Ankb7h+kMUM49x5kP3WML1TXTQHyM953oBQ4x7wGamyIf0uk1vaRyzKwM9F/J5k0N6B+kmU5s8Xc0M+RzFeskZrvOOnsaUFfJ7yhod+H8ji3WGYC0q2Ey5y56akbLeyse6qfWSI9eXRu5iQG7QysXUyMVsQC7u4g/LnSTHI7z2LyB4FcWo/Wubjtt0ER0gzqMD8318FL6MZ74N80cIghYEVIF7eQVB55FggsBtwYjAyRyh15kjHHfmOHctAOo80nhHcUrRp7iELXAdUHxP0aUYUpxRzTXFW4pXFEcUz6nmAl/Cb72mvyAn9o3jsIW/liVOzOZ1sU7V2VyqQuQMPMdKma/KWt2LDZwgsiQcEmB7qrRQLuVTnu3tuuxhL1U6OIQw3T4M1a+l2nZmfxZ5bgFzwVjIeMFClYKDfvJfKCWfLVKIameBE1NYM6X7yhZQCVuieBSd1Yp2z0eH/WDU4wAutOD/hfaPLjT8BO5b8+tbk0OnV6pB6wMecD/QQZc3vGd04D1L44J9VwMdMDbQrrcB9e0NsOdwYD8xOc7a9Tmq6lodl+q5HZc6NXycOC8=",
            answer: "m=edit&p=7VRNb5tAEL3zK6I972E/jAvc0jTuxXWbOlUUIcvCNolRwJsu0FRY/PfM7mLDApXaQz8OFWb0/JiZfezyJv9aRjLGLlzcwwRTuBjz9D0h6ne6bpMijYMLfFkWeyEBYPxxNsMPUZrHTthkrZxj5QfVDa7eByGiCCMGN0UrXN0Ex+pDUC1wtYRHCFPg5iaJAbxu4Z1+rtCVISkBvGgwwHuA20Ru03g9N8ynIKxuMVLrvNXVCqJMfItRo0P934pskyhiExXwMvk+eW6e5OVOPJXotESNq0sjdzkil7dy+VkuH5fLfr9cf1XXsO2fQfA6CJX2Ly30WrgMjrXSdUSMqVI4GWrOBrGJInhLcHbaixPBeyXcVwRpiYnf6+HSXg/X6/WYEosAdVRrvNdxpiPT8RZeAVdcx3c6Eh1dHec651rHOx2vdJzoONU5b9QmwDZ1e0ztakQJfP4EXp2DHsIA8wZzwBONffcMKfExpaTBtIOhlFKDqeKblhTa0KaWeoB9gxn4jp3yWYsZ1LJO7RnDusxrcqAP6/bx21re6OHAq/Pi5vzP+2z2cNnZc7PPag9rJ2RmHKjL/Tm0ckK0KLNNLC8WQmZRimAgoFyk67yUD9EWPm89L7DmDjrTolIhntPkYOcljwch49FHiox3j2P5GyF3ve4vUZpaRK6nn0UZo1pUIRPrfySleLGYLCr2FtFxrNUpPhS2gCKyJUZPUW+1rH3n2kHfkb5DDtOW/5+2f2naqiMgvzRz/8hs+7fk6K9XyFHrAz3ifmBHXd7wA6MDP7C0WnDoamBHjA1s39tADe0N5MDhwP3A5Kpr3+dKVd/qaqmB29VSXcOHK+cV",
        },
    ],
});
