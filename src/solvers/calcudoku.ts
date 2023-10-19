import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Distinct, Or, Product, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    // Numbers must be between 1 and N, where N is the width of the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(1, puzzle.width));

    // Each row and column contains exactly one of each number
    for (const [line] of puzzle.points.lines()) {
        cs.add(Distinct(...line.map(p => grid.get(p))));
    }

    // Clues indicate the sum, difference, product, or quotient of all numbers inside the region
    // For subtraction and division, try all possible locations of the largest number
    const regions = puzzle.regions();
    for (const [[p], text] of puzzle.edgeTexts) {
        const numberStr = text.match(/\d+/)[0];
        const number = cs.int(parseInt(numberStr), parseInt(numberStr));
        const region = regions.get(p);

        const choices = [];
        if (text === numberStr || text.match(/[+]/)) {
            choices.push(Sum(...region.map(p => grid.get(p))).eq(number));
        }
        if (text === numberStr || text.match(/[-−]/)) {
            for (const q of region) {
                choices.push(Sum(number, ...region.filter(p => !p.eq(q)).map(p => grid.get(p))).eq(grid.get(q)));
            }
        }
        if (text === numberStr || text.match(/[*x×]/)) {
            choices.push(Product(cs.int(1, 1), ...region.map(p => grid.get(p))).eq(number));
        }
        if (text === numberStr || text.match(/[/÷]/)) {
            for (const q of region) {
                choices.push(Product(number, ...region.filter(p => !p.eq(q)).map(p => grid.get(p))).eq(grid.get(q)));
            }
        }
        cs.add(Or(...choices));
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        solution.texts.set(p, model.get(arith).toString());
    }
};

solverRegistry.push({
    name: "Calcudoku (KenKen)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTBTttKFN3nK6LZdhaeGQdi7yiFbmheKVQIWRFygoEIJ6aOUypH2XfdTT+lH8Cf9Es4986YxLGrV7WqyqJxfHXmzPWd4+s5M/+wiPNE9nCZvvSkwqV1n2/fo391nU6KNAm7cm9R3GQ5gJT/HR7KqzidJ53IZQ07yzIIy2NZvg4joYQUGrcSQ1keh8vyTVgOZHmCKSEVuCObpAEP1vCM5wntW1J5wAPCNAA+Bx5P8nGaXBxZ5m0YladS0EIv+XGCYpp9TIQTQuNxNh1NiBjFBd5mfjO5czPzxWV2u3C5ariS5Z7Ve9Ki16z1ErR6CTX02tf4w3KD4WqFvr+D4IswIu3v17C/hifhEnHAUYVL4Xs+VeiaFywK4z6NjRspzbNd8zTv23z8jOd5D18t3VM7tsz3z18coznRFer5XLZrHr651p6zhEOOmuMpFMrScHzF0ePY43jEOQeQHGg0V4lQY1N52KvKczjYwOA9aAcOzCYMoIoTqIhxmDIq3kcRxyvkPGFayFZhrN1CGnbRTowm3uVoPGscb5BTYQ2RpnqWMPpSPVvxCnxVn3GV0wcOHN51PJpyxq3Z5+hz3OGW7dIn/4VN8Ttf53/lRNQxd/V+Dg07kTi4vE66gyyfxim2/2AxHSV5NcaBI+ZZejFf5FfxGO7h8wgGATfjzBqVZtldOpnV8ybXsyxPWqeITLB8S/4oyy+3qt/HaVoj7Olao+w5UKOKHCbfGMd5nt3XmGlc3NSIjQOhVimZFXUBRVyXGN/GW6tN1++86ohPgu/I4DQ3/07zv3Wa0zfwnpt9n5sc3r5Z3up90C32B9tqc8c3nA6+4WlasGlrsC3OBrttblBNf4NsWBzcD1xOVbeNTqq2vU5LNexOS206Php2HgE=",
            answer: "m=edit&p=7VXLbtNAFN3nK6LZMot5ObG9K6VlUwKlRaiyospJ3daqExc7ociR96zZ8Cl8QP+EL+HemUlsT4xUgRAsiOPRmTPX9x6P58yUH9ZxkVAPLulTRjlcQvj6Vgz/2+s8XWVJOKQH69VtXgCg9PXxMb2OszIZRDZqOthUQVid0uplGBFOKBFwczKl1Wm4qV6F1YRWZzBEKAfuxAQJgEcNfK/HER0akjPAE8TcPHcBeJ4W8yy5PDHMmzCqzinBQs/14wjJIv+YECsE+/N8MUuRmMUreJvyNr23I+X6Kr9b21g+rWl1YPSe9eiVjV650yv79JrX+MNyg2ldw7y/BcGXYYTa3zXQb+BZuKlRF7Y83BDFFGYYymdaFPR97Evb40KPDuVuXJl4+EnG2ONXQ3t8ZNJ8//zFMkK1EnnKN+OP3+zUXmgJx7oVuj0HhbSSun2hW6ZbT7cnOuYIJAcCJpeTUMCiYrBWObM4aGHgmdA4kG0YKBuASaTFGLHlFSSxPBctjIVEg4UtJMAuwooRyNsYAc9Ky0vWYAEiJWthv3l2y/Ogya/xNsYHHFg8tnyNaw+n5lC3SrcjPWVj/OSwKNpTOupOplkLBKtFaFNhjErwlfTH2xF6IXgtQiKhWoSyS3FHBA4h3SrSrSLdKtKtIn2XCJxHlFtFcUeHEk5ZNXZzuFWU+y4ec3J43CnrjdyIsZvDreIFTo4R6wgznq23xjBevmiZB1dCPYiE2cPx8p6GpoOIHF3dJMNJXiziDHaYyXoxS4ptH/Z0UubZZbkuruM5bFB6y6eaW+rIDpXl+X2WLrtx6c0yL5LeISQTKN8TP8uLKyf7Q5xlHaLUB1iHMltth1oVaacfF0X+0GEW8eq2Q7T23E6mZLnqCljFXYnxXexUWzTvXA/IJ6LvSMKBKf8fmH/rwMRvwH7h2Pyd8+sJG/a/JUcv37zo9T7QPfYHttfmlt9zOvB7nsaC+7YGtsfZwLrmBmrf30DuWRy4n7gcs7pGR1Wu17HUnt2xVNvx0XTwAw==",
        },
    ],
});
