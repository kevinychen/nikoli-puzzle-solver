import { Constraints, Context, Point, Puzzle, Solution, Symbol, ValueMap, Vector } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a diagonal line in every cell, connecting two opposite corners
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    const trees = new ValueMap(puzzle.points.vertexSet(), _ => cs.int());
    for (const [junction, text] of puzzle.junctionTexts) {
        const [p1, p2, p3, p4] = [...junction].sort(Point.compare);
        const pointingAts = new ValueMap([
            [Vector.NW, grid.get(p1)?.eq(0) || false],
            [Vector.NE, grid.get(p2)?.eq(1) || false],
            [Vector.SW, grid.get(p3)?.eq(1) || false],
            [Vector.SE, grid.get(p4)?.eq(0) || false],
        ]);

        // A number indicates how many lines meet at that corner
        cs.add(Sum(...[...pointingAts.values()].map(arith => And(arith))).eq(parseInt(text)));

        // Lines cannot form loops
        const p = Point.center(...junction);
        const terms = [...pointingAts.keys()]
            .filter(v => trees.has(p.translate(v)))
            .map(v => ({ q: p.translate(v), term: pointingAts.get(v) }));
        cs.add(
            Or(trees.get(p).eq(1), Sum(...terms.map(({ q, term }) => And(term, trees.get(q).le(trees.get(p))))).eq(1))
        );
        cs.add(...terms.map(({ q, term }) => Implies(term, trees.get(q).neq(trees.get(p)))));
    }

    const model = await cs.solve(grid);

    // Fill in solved slant lines
    for (const [p, arith] of grid) {
        solution.symbols.set(p, model.get(arith) ? Symbol.NE_TO_SW : Symbol.NW_TO_SE);
    }
};

solverRegistry.push({
    name: "Slant (Gokigen Naname)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZVNb9s8DMfv+RSFzjr4pXma+NZ13S6pty55UBSGESiJ2xi1o06218FBvntJKoEtSwM2YMN6GJwwzE8U9TdlytXXRqiMj+EKJ9zjPlxBMKHvuYef07XI6yKLzvhlU2+lAofzTzF/EEWVjZJjUDrat9OoveXtxyhhPuMsgK/PUt7eRvv2Jmpj3s5hiHEf2EwHBeBed+4djaN3paHvgR+j7+l59+Cvc7UusuWNjvwcJe2CM1zoHU1Hl5XyW8aOQvD/WparHMFK1HAz1TZ/Po5UzUY+NcdYPz3w9lLrnTv0hp1edLVe9Cy9WlxP7kwn+q1yp+nhAHX/AoKXUYLa/+/cSefOoz3YONqzaXi6U9gcDxNOx0Piez4i2L8eonkGgh9AoYFoopHLd0yc2FFTK1dgiwgCO+rCyhXY6UOSauQKbakhpe8QlMynwt2fCgcDxsOni2dRXUAHdubQhXRgdxIqqAPjXTswFtbGVFwHxgo4MBbZgd1LUrEd2L0kFX2AoeQfqPAB2QU8xLwNyb4n65Edk51RzDXZO7JXZM/J/kcxF9gGv9Qo/b3/Q3KSQJ+5eI1/zktHCYubcpWps1iqUhRwKMy34jljcPyyShbLqlEPYg1nCZ3OcFwA29EMAxVSPhf5zozLH3dSZc4hhNnm0RW/kmozyP4iisIA+lVjIL3fBqoVHHm9/0Ip+WKQUtRbA/SORyNTtqtNAbUwJYonMVit7O75MGLfGX2TEN5t4b932996t+EeeG+tcd+aHHp8pXL2PmBH+wN1tvmRW50O3OppXNBua6COzgY6bG5Adn8DtFoc2A+6HLMOGx1VDXsdl7LaHZfqd3ySjl4B",
            answer: "m=edit&p=7ZZRT9swEIDf+yuQn/2Q2Emb5A0Y20vpxsqEUFRVaRtoRFqzJB0oVf8753Ohdc5Im7Rpe5hCjuvn89354otTf99kVc5DuGTEPe7DJUSEd+Dpv9frumjKPDnhp5tmqSpQOP884ndZWee9dG806W3bOGmvePspSZnPOBNw+2zC26tk214m7Yi3Yxhi3Ac2NEYC1IuDeoPjWjs30PdAH2ndM/NuQZ8X1bzMp5fG8kuSttec6UBnOF2rbKV+5GyfiP49V6tZocEsa2Ax9bJ43I/Um4V62Oxt/cmOt6cm37EjX3nIV77lK135muSO0h0aR7813Xiy20Hdv0LC0yTVuX87qNFBHSfbnc5ry2L5ulKuawoO47BLfM/XSFhIEgT/AEkL+cSX75gYUauY+BI0CSGo1YD4EtS99IgvSVOVwkZQMh8Ld/taOBiwNp8pHqGmgA7s9GEK6cBuJ/47TiI3jp1YuH1jgR144MbukNK9HOkOKR0hoeQfsfAC5TVsYt5KlB9QeihDlEO0uUB5g/IcZYCyjzYD3QbQKMc++mT2CKV55CbC+O3xC72okDP1PD3DRmZYwr5FBCGSkICQuOsZC2jZYO1sG0GIJCQifuIuCUisgKwrIOsKBoRE3egBiRWSWCFZV9gnNiRWSGKFpIb9zvN620Z6i+x6qTDnnb7Cn9MmvZSNNqtZXp2MVLXKSnghj5fZY87g6GO1Kqf1prrL5vAex5ORI1vjDAuVSj2Wxdq2K+7XqsqdQxrmi3uX/UxVi473p6wsLVDjMW8h02sWaqrC+p1VlXqyyCprlhY4OposT/m6sRNoMjvF7CHrRFsd1rzrsWeGdyrhu0L+/674W98V+hl4v/R1cXxg/rF3+L+VDm5fVTl7H7Cj/YE623zPSacDJz2tA9K2BurobKDd5gZE+xsgaXFg73S59tptdJ1Vt9d1KNLuOtRxx6eT3gs=",
        },
    ],
});
