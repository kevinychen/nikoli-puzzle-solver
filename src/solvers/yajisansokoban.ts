import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({ Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines to move some of the boxes
    const [network, grid, order] = cs.PathsGrid(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(
            Implies(
                arith.neq(0),
                Or(arith.isLoopSegment(), order.get(p).eq(0)).neq(puzzle.symbols.get(p)?.isSquare() || false)
            )
        );
    }

    // A box can be moved horizontally or vertically, but cannot make a turn
    for (const [_, arith] of grid) {
        cs.add(Implies(arith.isLoopSegment(), arith.isStraight()));
    }

    // A number indicates the amount of boxes in the given direction
    // If a box stops on top of a clue, the number becomes meaningless (it may be true or false)
    for (const [p, text] of puzzle.texts) {
        const [v] = puzzle.symbols.get(p).getArrows();
        cs.add(
            Or(
                order.get(p).eq(0),
                Sum(
                    ...puzzle.points
                        .lineFrom(p, puzzle.lattice.bearing(p, v))
                        .map(p => Or(puzzle.symbols.get(p)?.isSquare() ? grid.get(p).eq(0) : order.get(p).eq(0)))
                ).eq(parseInt(text))
            )
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Yajisan Sokoban",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVNb9pAEL3zK6I978EfYBLfkjT0QmlTqKLIstACS7Bis3RtN5UR/z0zYyfG9railaLmUFk7Gt4OO88788bp91xoyT143HNucRsex/No2f0+Lat6ZlEWS/+MX+bZRmlwOP88GvG1iFPZC6qosLcvLvzilhcf/YDZjDMHls1CXtz6++KTX0x4MYUtxm3AxmWQA+5N7d7RPnrXJWhb4E8qH9x7cIXW6mm+VrmWqwc5vyp3vvhBMeMM813RKeiyRP2QrOKDv5cqWUQILEQGL5Vuol21k+Yr9ZhXsXZ44MVlSXtqoO3WtNEtaaNnoI1vg7SXkV7Gcj5+A7oX4eEA1/8VCM/9ALl/q93z2p36e7ATf8/cAf4VKmSXNWKu1waGLcBzELCOALcd0X+5PgIglU0J7yGhg8ED4E19V90Cc80okoO+sl87EPuLmwtfMj89Gl/r5Oi+kd8AM3ZQup8XNZCifncyXd7p0Xizp0cb+Q0NKBRnRCVyyM6gTXjhkv1A1iI7IDummBuyd2SvyfbJehQzxEb7o1Y87pI3ohM4Ds238hn8vR/2AjbJk4XUZxOlExGDGKcbsZMMph9LVTxPc70WS9AwDUe4bMC29I8GFCu1i6NtMy562CotjVsIYoUN8QulV63Tn0QcN4Cy5A2onEYNKNMwao5+U3M1kERkmwZwNJYaJ8lt1iSQiSZF8Sha2ZL6nQ899pPRClxodPf/p+Uff1qwFNZ7U/V7o0NdrLRxBABsmAKAGtVe4R3BA96RNibsqhtQg8ABbWscoK7MAewoHbBfiB1PbesdWbUlj6k6qsdUx8IPwt4z",
            answer: "m=edit&p=7VVRb5swEH7Pr6j87AfAYFre2q7dS5atS6eqQlFEUtqgkjhzYJ2I8t97dyYhEG9qJlXbw2Rx+vh8+D7su/Pqe5nolEsY4pQ73IXhSUmP6/v0OPW4zYo8jU74eVnMlAbA+efra/6Y5Ku0F9deo966OouqG159jGLmMs48eFw24tVNtK4+RdWAV0OYYtwFrm+cPIBXDbyjeUSXhnQdwIMaA7wHmGitXsaPqtTpw1M6vjAzX6K4uuUM413QKgjZXP1IWa0H36dqPsmQmCQF/NRqli3rmVX5oJ5Ltg214dW5kT20yBaNbLGTLeyyvVr2NNPTPB3330Hu2Wizge3/CoLHUYzavzXwtIHDaL1BXWsmAvwUTsg1Z8SE7BJhh5AeEs4eIboe/nb7iIBQLgW8h4AeOgegm/Ku3gUm7CyKizEnnWYAbz14o/zt3uEx3r5VXyBtLO1P3Kzq/nZl2ry3e/tHeVv1hRYWDueajsgjewtpwitB9gNZh2xAtk8+V2TvyF6S9clK8gkx0SAV99eQ268hCbgHfyLw4Lmokc/xvBFJ7ktCvuCBMEjywHCB4NJw0KFkSCiUPES0kzUga7LOSB9uM3D3eyh904s9j3qeGcGf41EvZoNyPkn1yUDpeZJDgQ5nyTJl0BHZSuXjVakfkynUNTVMTtyCvmhRuVLLPFu0/bKnhdKpdQpJPHWL/0Tph87qL0metwiTBi3KdKgWVeis9U4J12LmSTFrEXutqrVSuijaAoqkLTF5TjrR5s0/b3rsJ6MnFpD84v9185evGzwK56hLZ/8+eLfG82/JoSxW2toCgLZ0AWCt1V7zBwUP/EFpY8DD6gbWUuDAdmscqMMyB/Kg0oH7RbHjqt16R1XdksdQB1WPofYLPx71XgE=",
        },
    ],
});
