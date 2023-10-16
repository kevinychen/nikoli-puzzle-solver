import { Constraints, Context, PointSet, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({}: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board according to the numbers
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Clues outside the grid represent the lengths of each of the blocks of consecutive shaded
    // cells in the corresponding row or column, in order from left to right or top to bottom
    const texts = new PointSet(puzzle.lattice, [...puzzle.texts.keys()]);
    for (const [line, p, bearing] of puzzle.points.lines()) {
        cs.addContiguousBlockSums(
            line.map(p => grid.get(p)),
            texts
                .lineFrom(p, bearing.negate())
                .map(p => puzzle.texts.get(p))
                .reverse()
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
    name: "Nonogram",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VXPT9tMEL3nr0B73oPXduy1b5QPeqFpKVQIWRFygoEIJ6ZOUipH+d95M+tN4h9Vv6qqyqGyspr3ZjLzZtezXn5dp2UmtQylp6UjFR7Pd6Xn+NIPFP+c+rmarfIsPpLH69VjUcKQ8uPZmbxP82U2SFxEeNIZDzZVFFcXsnofJ0IJKVz8lBjL6iLeVB/iaiSrS7iEVODOTZAL89SY2oF9zQHEnhhWETuqbZg3MKezcppnt+eG+RQn1ZUUVOgd/5tMMS++ZaIWQnhazCczIibpCt0sH2fPtWe5viue1nWsGm9ldWz0Xvbo9fZ6yTRyyeqRS138YbnReLvFvn+G4Ns4Ie1f9qbem5fxBuso3ghP2U7N4QjPIwJnZQm/HeG7RHgHROcvfpsYtogh5zhIGnQITnpIcNIDIgxahNZE+HtCOU6DQc+KO7/h9YxXl9crbIysPF7/49XhdcjrOcecYr+Ur6UKkFY7SBlgUEIoZ+BH8GCzjAcDFKIFBkOEUYPG48KDXowHYdSp8XjwYKeMB2HUsvH48KBdA1AntApCUmCLhlTU1tFIoG1qDY/eeVBH29QRQLQDqBNZBdEQoC7qOkPpOjsQAIQWhADYeQYKQO2ABogsiKTr1qpdF8CzwHMA6hZgAFihQ2gLrJwAckIuiqO45gM54dXnNeCDCun9/qUJ+P134qdyEuqjfvD2/B9rPEjE6d1DdjQqynmaY9ZH6/kkKy3G7SqWRX67XJf36RRXBV++uA3ALTiyQeVF8ZzPFs242cOiKLNeF5EZyvfET4ryrpX9Jc3zBmE+Jg3KXHoNalXiRjvAaVkWLw1mnq4eG8TB7dfIlC1WTQGrtCkxfUpb1eb7nrcD8V3wL8GHC9f3v0/XX/p00Rk4b21835ocfn2Lsnf2QfeMP9jeMa/5zqSD78w0FeyONdieyQbbHm5Q3fkG2RlxcD+YcsraHnRS1Z51KtUZdyp1OPHJePAK",
            answer: "m=edit&p=7VXLbtswELz7KwKeeeBDoijd0jTpJXWbJkURCIYhO0piRLZS2W4KGf73DilRth4FUhRFeygEkTuz692hyaXWX7dJkVJNAyo1ZZTjkZ6gknnUU9y+rH5uFpssjU7o6XbzmBcwKP1wcUHvk2ydjmKBCEnZZLQrw6i8ouW7KCacUCLwcjKh5VW0K99H5ZiW13ARysFdVkEC5nllagb7iw0w7FnFcsOOaxvmLcz5ophn6fSyYj5GcXlDiSn0xv7amGSZf0tJLcTgeb6cLQwxSzZYzfpx8Vx71tu7/GlLXIk9LU8rvdcDeuVBr2zkymG54s/LDSf7Pf73TxA8jWKj/fPB1AfzOtrtja4dkdyttNocIqUhxIHwuhGeMIQ8Ino/8bqE3yF80UmqeoTsEl6HCFSH0NoQ3oHgjLUYrJnbld/a8cKOwo43+GNoKe341o7Mjr4dL23MOf4v7mnKFdJqhpQKjRKIGnghPNx50ECBrIGPMOXClIDHcx6EKRemJDy+8yBMuTDlwaMcQJ3AKQiMAlc04EdyNBJol1rDoxsP6miXOgQIG4A6oVMQ+gB1UcF8KlgDFEDgQACga8ABeAM0QOhASIWoVQsBIB2QDIA7wAGcUB/alJOjICewRfem0cyGnNnRs6OyGxWY840OON5I1d7C6uA3R6HaZjQE8ZEc58QUNFONQjsF2k4hqyZeTaKapJ04E/XssFfPJmFz6KqDZvTvR7FZYP3o11mTUUzO7x7Sk3FeLJMMl8B4u5ylhcO4dsk6z6brbXGfzHGH2FuZWm5lI1tUlufP2WLVjls8rPIiHXQZMkX5gfhZXtx1sr8kWdYi1vYr06Kq27BFbYpFCydFkb+0mGWyeWwRR9diK1O62rQFbJK2xOQp6VRbHta8H5HvxL6xNF+1/9+0v/VNM3vAfunL9vt3/SuumX9Ljj2+eTHY+6AH2h/sYJvXfK/Twfd62hTstzXYgc4G221uUP3+BtlrcXA/6XKTtdvoRlW3102pXrubUscdH09GPwA=",
        },
    ],
});
