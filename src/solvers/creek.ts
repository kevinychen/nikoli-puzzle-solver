import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form regions of unshaded cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Numbers indicate the amount of shaded cells which overlap the clue
    for (const [junction, text] of puzzle.junctionTexts) {
        cs.add(Sum(...Array.from(junction, p => grid.get(p) || cs.int(0, 0))).eq(parseInt(text)));
    }

    // All unshaded cells on the board form an orthogonally connected area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(0));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Creek",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZZPb9s8DIfv+RSFzjpYdv761vXtdmmzdelQBEZQKKnbBHWiTnHeDg7y3UtS7myF2mFAh/UwOBboRxL9k0lK2X7faZvLAVzJUEZSwZVEXbr7Ef5er+tVWeTpiTzdlUtjwZDy81je62Kbd7J60Kyzr0ZpdSWrT2kmlJAihluJmayu0n11mVZTWU2gS0gF7MINisE8b8wb6kfrzEEVgT1GO3LzpmAvVnZR5LeXbuSXNKuupcAXfaDpaIq1+T8XtRB8Xpj1fIVgrktYzHa5eqp7trs787irx6rZQVanTu8koDdp9KLp9KLF9DpxLbkXztGbyh3NDgf47l9B8G2aofZvjTlszEm6h3ac7oVKeq9LhehE6FElA45GDHW7iDAMDaKJPuITe4qjPiJIkBaiiR7qD9nEAfnyRg0SjkiXj7iuYczQiNwnHqJle75G5Ku97Dhia4wj0tX2FUe0bG+i4hMVTfQRBa0RAcFUFNLpz5BCj1cXdVgDGNVzTOEN4LATCjPHFOoAxnUHcNgJhZ1jCn0A49cK4LBuSgOOKRU4pnQI4PCnorRg2KVGAAd1uxThmNIkgMNOKF2OMCTLR0qZmNpr2BhklVD7H7URtT1qL2jMObU31J5R26W2T2MGuLX81ubTzto/JCeLu3SOvV69t3+adTIx3q3nuT0ZG7vWBWzMk6V+ygUcgWJritvtzt7rBezndELClg1sQzM8VBjzVKw2/rjVw8bYPNiFML97CI2fG3t35P1ZF4UH3HHvIZcfHiotHDutZ22tefbIWpdLD7SOKM9Tvil9AaX2JepHffS2dbPmQ0f8EHRnCfy/SP79v/hb/y8wBtF7K/T3JofS19hg7QMOlD/QYJnXnFU6cFbT+EJe1kADlQ30uLgB8foGyEoc2C+qHL0eFzqqOq51fBUrd3xVu+KzWecF",
            answer: "m=edit&p=7ZZBb9sgFMfv+RQVZw7GOCb41nXdLm22Lp2qyIoqJ3Ubq07c2c46Ocp33+ORNsG8HSZ12g6TE8A/Ho8/hgc03zZZnXMFjxzxgAt4ZBDhPw7M7+W5LtoyT0746aZdVjUUOP805vdZ2eSDdG80G2w7nXRXvPuYpEwwzkL4Czbj3VWy7S6Tbsq7CVQxLoBdWKMQiueH4g3Wm9KZhSKA8tiUA9tuCuVFUS/K/PbSWn5O0u6aM9PRO2xuimxVfc/ZXoh5X1SreWHAPGthMM2yeNrXNJu76nGztxWzHe9Ord4JoVce9MpXvZLSa8Udyb2wjt5Urp7tdvDdv4Dg2yQ12r8eiqNDcZJsd0bXlgk5fBkqNx8VPAqpfKQ9FEUGBQ5SPvIbDoWPYoNCB2kPxSOvoRKelZI+Uj7ydY1CD2l0Lx0Ueb607g87DLwxhoHs+wqD2Gso/IZC+mjoioDJFDil09cphRonLvbTSmBNYpxeAtNOItoJTjWBYxrTTnDafaxo3zj9BKZ1K7pLXAo+1nSXmv5UmvRtlwaBSd12ifhY0E4E7UQQCwIWywdcMiGm17Ax8E5i+h7TANMhphdoc47pDaZnmEaYxmijzNYCm8+xj9hrPcbULlbbA+xFLASBoC8cYSYDzKLYZspmGrOhrTMLy2ShzaxJLG1mvShrqaylsnUqwmxk22lbp22dtnXaaLGh9PpdzJh3gzSM8FB8eYZv/zYbpGy8Wc3z+mRc1aushF1+ssyecgbnKWuq8rbZ1PfZAg4HPG45sjW2cFBZVU9lsXbtiod1VedklYH53QNlP6/qu57356wsHdDg3cFBdrE5qK0L5z2r6+rZIausXTrg6LxzPOXr1hXQZq7E7DHr9bY6jHk3YD8Y/lMJlxX5/7Lyty4rZg6C37qyHJ91f2wT+7fk4PKtajL2ARPhD5QM8z33Ih24F9OmQz+sgRKRDbQf3ID8+AbohTiwX0S58doPdKOqH+umKy/cTVfHEZ/OBj8B",
        },
    ],
});
