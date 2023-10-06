import { isEqual, range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // You cannot shade a cell with a number
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // Numbers represent the lengths of the blocks of consecutive shaded cells in the (up to) eight
    // cells surrounding the clue
    // Numbers aren't necessarily in order
    for (const [p, text] of puzzle.texts) {
        const neighbors = puzzle.lattice.vertexSharingPoints(p);
        const expectedBlockSizes = [...text].map(i => parseInt(i)).sort();
        cs.add(
            Or(
                ...range(1 << neighbors.length)
                    .map(i => [...i.toString(2).padStart(neighbors.length, "0")].map(c => parseInt(c)))
                    .filter(bitmap => {
                        if (bitmap.every(i => i === 0) && text === "0") {
                            return true;
                        }
                        if (bitmap.every(i => i === 1) && text === bitmap.length.toString()) {
                            return true;
                        }
                        const bits = [...bitmap, ...bitmap];
                        const blockSizes = range(bitmap.length)
                            .filter(i => bits[i] === 0 && bits[i + 1] === 1)
                            .map(i => bits.indexOf(0, i + 1) - i - 1)
                            .sort();
                        return isEqual(blockSizes, expectedBlockSizes);
                    })
                    .map(bitmap => And(...neighbors.map((p, i) => (grid.get(p) || cs.int(0, 0)).eq(bitmap[i]))))
            )
        );
    }

    // The shaded cells cannot form a 2x2 square
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Or(...vertex.map(p => grid.get(p).eq(0))));
    }

    // All shaded cells form an orthogonally contiguous area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(1));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Tapa",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRRb5s8FH3nV1R+9gOYlLS8dV2zlyxbl3yqKoQiJ6ENKsSdgXVylP/eey9MYGAPm6ZvfZgsXx2OL/ceg4+Lr5XUCQ9g+Bfc5R4MEQQ0vcmEptuMVVpmSXjGr6pyrzQAzj/NZvxBZkXiRE1W7BzNZWhuufkQRsxjnAmYHou5uQ2P5mNoFtwsYYlxD7h5nSQA3rTwjtYRXdek5wJeAJ7Ur90D3KZ6myXreZ34OYzMijPs847eRshy9S1hjQ583qp8kyKxkSVsptinz81KUe3UU9XkevGJm6ta7nJErt/KRVjLRdSX2+zHlouF/qjcy/h0gs/+BQSvwwi1/9fCixYuwyPERXhkwqdXfRDD4ZtCQREgI+Bn/WACgUwnJZhSSktMqUonY0pFPPwCxEA3j3reU5xRFBRXIIkbn+J7ii7Fc4pzyrmheEfxmuKEYkA5U9zUL237f5ATCUEeqsf57+PYidiiyjeJPlsoncuMgbNYobJ1UekHuYVzQsaDowDcgTItKlPqOUsPdl76eFA6GV1CMtk9juVvlN71qr/ILLOI+iKxqPrEW1Sp4Th3nqXW6sViclnuLaJz9K1KyaG0BZTSliifZK9b3u755LDvjGbkw7Xl/7u2/tK1hb/AfWsufmty6PQqPWp9oEfcD+yoyxt+YHTgB5bGhkNXAztibGD73gZqaG8gBw4H7icmx6p9n6OqvtWx1cDt2Kpr+Ch2XgE=",
            answer: "m=edit&p=7VRRb5swEH7nV1R+9kPAYFreuq7ZS5atS6aqQlFEEtqgQugMrBMR/73nO1ZiYA+bpm0Pk+Xz+buz7zuSz8WXKlIxlzDEOZ9wG4YjJU7bdXFO2rFMyjQOzvhlVe5zBQ7nH6ZTfh+lRWyFbdbKOtYXQX3D63dByGzGmQPTZite3wTH+n1Qz3m9gBDjNmAzSnLAve7cW4xr74pAewL+HHyXjt2Bu03UNo3XM0r8GIT1kjNd5w2e1i7L8q8xa3no/TbPNokGNlEJzRT75KmNFNUuf6zaXHvV8PqS6C5G6IqOrnilK0botv2YdO3fTfdi1TTw2T8B4XUQau6fO/e8cxfBsdG8jswReFQAGQ7fFC50pEYcp0Oko5GTFOljSgf4opfh4yW2/R2BajbWvEM7ReugXQIlXgu0b9FO0HpoZ5hzjfYW7RVaF63EHF83BW2f3iEHp+doiQVVWOj+oTeg6Li0eLT4uAiKCUELxQTFXAJdOudSzJW0UIpHxz3K9CgmaSfpnCTQp52vb3n9RvRddM+NFToOCpKG9+v+ygrZvMo2sTqb5yqLUgYyZUWerotK3Udb+NOhijliB8w0oDTPn9LkYOYlD4dcxaMhDca7h7H8Ta52vdufozQ1gAJfJQMi+RhQqRJjHymVPxtIFpV7AzjRkXFTfChNAmVkUoweo161rOu5sdg3hjMU8AaK/2/gX3oD9U8w+amX8I+8UP8WHfz35mpU+gCPqB/QUZW3+EDogA8krQsOVQ3oiLAB7WsboKG8ARwoHLAfiFzf2te5ZtWXui41ULsudSr4cGW9AA==",
        },
    ],
});
