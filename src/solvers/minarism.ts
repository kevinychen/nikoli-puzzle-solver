import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Distinct, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    // Numbers must be between 1 and N, where N is the width of the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(1, puzzle.width));

    // Each row and column contains exactly one of each number
    for (const [line] of puzzle.points.lines()) {
        cs.add(Distinct(...line.map(p => grid.get(p))));
    }

    // An arrow points from a larger number to a smaller number
    for (const [[p, q], symbol] of puzzle.junctionSymbols) {
        const [v] = symbol.getArrows();
        if (v) {
            const [big, small] = p.translate(v).eq(q) ? [p, q] : [q, p];
            cs.add(grid.get(big).gt(grid.get(small)));
        }
    }

    // A number clue indicates the difference between the two adjacent cells
    for (const [[p, q], text] of puzzle.junctionTexts) {
        cs.add(Or(grid.get(p).eq(grid.get(q).add(parseInt(text))), grid.get(q).eq(grid.get(p).add(parseInt(text)))));
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        if (!puzzle.texts.has(p)) {
            solution.texts.set(p, model.get(arith).toString());
        }
    }
};

solverRegistry.push({
    name: "Minarism (Futoshiki)",
    keywords: ["Mainarizumu"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRBb5swGL3nV1Q++wAkTRNuXdftkrJ2yVRVCEVOQhtUiDMD60aU/973GSZi8A47VOthIny8vO8zfp/tR/69FCrmI1zDCXe4S9cUT9xTl35Ocy2SIo39M35ZFlupADj/EvBHkebxIGyKosGhmvrVHa8++yFzGWcebpdFvLrzD9WNXwW8miPFuAtuVhd5gNctvNd5Qlc16TrAQYMBHwCTXQzlaVL8qrlbP6wWnNFMH/R4giyTP2LWKKH/a5mtEiJWokA3+TbZN5m83Mjnsql1oyOvLmvBc4vgYSuYYC2YkEUw9UGC14lap/Fy9gZyp9HxiIX/CsFLPyTt31o4aeHcPyAG/oF57u9O691h7mhMDHarZS6MGox09fgHjK/LkWi6utFdNWP69HgE2uPdTYMMB4mhLUECrQnPloCsT1qcp+MC/fJqqONHHR0dz3Wc6ZprHe91vNJxpONY11zQiv3Vmp6uzxvJCd1J7U9+bn9Gg5AFZbaK1VkgVSZSnJb5VuxjBmOyXKbLvFSPYo1Dpn2LcwRup0cYVCrlPsUSG2TytJMqtqaIjDdPtvqVVJvO219EmhpE/REyqPoEGVSh4IWT/0Ip+WIwmSi2BnHiG+NN8a4wBRTClCieRWe2rO35OGA/mb5xEh0Y//9X71999WgTnPfm0/cmR59fqazmB23xP1irzxu+Z3XwPVPThH1fg7VYG2zX3aD6BgfZ8zi4P9ic3tp1Oqnqmp2m6vmdpjq1fBgNXgE=",
            answer: "m=edit&p=7VTBcpswEL3zFRmddUCAsc0tTdNeHLep3clkGI9HtknMBCxXQNPi4d+zWrCxBDn0kEkOHcx6ebuSnlZ6m/0quIyoB487ojZl6hnb+I6Z+tnNM4/zJAou6GWRb4UEh9JvU/rAkyyywiZpYR3KcVDe0vJrEBJGKHHgZWRBy9vgUN4E5ZSWMwgRygCb1EkOuNete4dx5V3VILPBnzY+uPfgxrsImCdx/rfGvgdhOadErfQJxyuXpOJ3RBom6nst0lWsgBXPYTfZNt43kazYiKeCHBepaHlZE571EHZbwu6JsNtP2GkIr2O5TqLl5A3ojhdVBYX/AYSXQai4/2zdUevOgkOleB2Iw447rU+HMM9XiHOODLUcGMlw/D2Mr9Mh0OzqBnfVjOnCvgewQ81DAxo2BNy+AHst4PQFgNYXJOegncN+aemi/YzWRjtAO8Gca7R3aK/Qemh9zBmqikFNz+fwO6NVKdlIlcmDgz4WbqwAtwUcuyntCfBNYGjM4Yya2p8Ac1LXMzLcgTGp65tDzFU8x8jwXGNSzzOH6KucLkVd39nxgpzOQNW3skI2qhsLHfT/L6yQTIt0FcmLqZApT+Caz7Z8HxHoKCQTyTIr5ANfgzqw4VDEdjhCgxIh9gncDQ2MH3dCRr0hBUabx778lZAbY/ZnniQakGH31KD66mtQLmPtm0spnjUk5flWA84Er80U7XKdQM51ivyJG6ul7Z4ri/wh+IKEbOhY/9v1e7VrdQj2PzXt8wb8Zv3uY9HB+ytkr/gB7tE/oL06b/CO1AHviFot2NU1oD3SBtRUN0BdgQPY0Thgr8hczWoqXbEyxa6W6uhdLXUu+XBhvQA=",
        },
    ],
});
