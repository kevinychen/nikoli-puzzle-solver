import { range } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place several 1x2 and 1x3 blocks on the board, which don't overlap each other
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Each number is contained in a block
    // Blocks must contain exactly one number
    const placements: ValueMap<Point, [Point[], number, number][]> = new ValueMap(puzzle.points, _ => []);
    const trains = [...puzzle.texts.keys()];
    const trainLocation = trains.map(_ => cs.int());
    for (const [instance, p] of trains.entries()) {
        let type = 0;
        const choices = [];
        for (const bearing of puzzle.lattice.bearings()) {
            const line1 = puzzle.points.lineFrom(p, bearing).slice(1);
            const line2 = puzzle.points.lineFrom(p, bearing.negate()).slice(1);
            for (let index1 = 0; index1 <= line1.length; index1++) {
                for (let index2 = 0; index2 <= line2.length; index2++) {
                    if ([2, 3].includes(index1 + index2 + 1)) {
                        const train = [p, ...line1.slice(0, index1), ...line2.slice(0, index2)];
                        choices.push(
                            And(
                                ...Array.from(train, p => grid.get(p).eq(instance)),
                                trainLocation[instance].eq(type),
                                // A number inside a block indicates how many spaces the block can move
                                Sum(
                                    ...range(index1 + 1, line1.length + 1).map(k =>
                                        And(...line1.slice(index1, k).map(p => grid.get(p).eq(-1)))
                                    ),
                                    ...range(index2 + 1, line2.length + 1).map(k =>
                                        And(...line2.slice(index2, k).map(p => grid.get(p).eq(-1)))
                                    )
                                ).eq(parseInt(puzzle.texts.get(p)))
                            )
                        );
                        for (const q of train) {
                            placements.get(q).push([train, instance, type]);
                        }
                        type++;
                    }
                }
            }
        }
        cs.add(Or(...choices));
    }
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                arith.eq(-1),
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(...placement.map(p => grid.get(p).eq(instance)), trainLocation[instance].eq(type))
                    )
            )
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved trains
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Tren",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv+Ssqn33AkJ/cuq7ZJcvWJVNVIRQ5CW1QIe4MrJOj/O9970EFBnbYYV0Pk+Wnx8fP+Gvw19mPQuqIT6F5U+5wAc0butRdZ0bdqdo6zpPIv+CXRX5QGhLOv8zn/F4mWTQIqqpwcDIz39xw88kPmGCcudAFC7m58U/ms2+W3KxgiHEBbFEWuZBe1+ktjWN2VULhQL6sckjvIN3FepdEm0VJvvqBWXOG63yg2ZiyVP2MWKUDn3cq3cYItjKHzWSH+KkayYq9eiyqWhGeubks5a565Hq1XExLuZj1yMVd/GW5s/B8hs/+DQRv/AC1f6/TaZ2u/BPEpX9i7uR1p+W/YZ5AAL/qFQzdVsV4iGDYAKPWlAmBxpSp06oQDhGvQYQ9CfQJUnlHcU7RpbiGTXDjUfxI0aE4origmmuKtxSvKA4pjqlmgp/hjz7UG8gJ3DG5rm6jt30OBwFbFuk20hdLpVOZMPAwy1SyyQp9L3dwIsnicOiAHanSQolST0l8tOvih6PSUe8Qwmj/0Fe/VXrfevuzTBILlFeWhUpvWSjXYJzGs9RaPVsklfnBAg2TWW+KjrktIJe2RPkoW6ul9Z7PA/aLUQ88uCC9/xfkP7og8Rc47839700OnV6le60PuMf9QHtdXvGO0YF3LI0Ldl0NtMfYQNveBtS1N8COw4H9xuT41rbPUVXb6rhUx+24VNPwQTh4AQ==",
            answer: "m=edit&p=7ZVNc5swEIbv/hUZnXVAH2DBLU2TXlK3qdPJZBhPBjsk8QSbFNtNB4//e1+JtfkwPfTQtIcOw/LwslqthFZafdskRcoNLmW4xwUupaW7pRe626Prer7O0uiEn27WT3kB4PzTxQV/SLJVOojJazLYlmFUXvHyQxQzwTiTuAWb8PIq2pYfo3LEyzE+MS6gXVZOEnhe4437bumsEoUHHhEDb4GzeTHL0rvLSvkcxeU1Z7afd661RbbIv6eM8rDvs3wxnVthmqwxmNXT/IW+rDb3+fOG7bvY8fK0Snfck66q01WHdFV/uvLPpxtOdjtM+xckfBfFNvevNZoax9F2Z/PaMjncj7T6N0wJK8ha0LLjEWgr6Ibgd5oM/U4T43U8hOcU1VBEuxHyEy7LW2cvnJXOXmMQvFTOvnfWc9Z39tL5nDt74+yZs9rZwPkM7TRgopoxgnZrJnzDxRBpKuTjh2BR8VCCFbEC64oD2WCr++SDYjKSGGVlqK2Bj9F1zD0bDaa2xgcH5KNrNgF4SLpfs0GckOKE8A/9uq8DW53ihIgTVm2l56PIA+IATDFD/8B4gs2hbc1WDysf4XEpBLEAS2L4CENswGEd88DQZTXneIIpjt2A9mzjS4opsTlJRazAmnxkzQo5KPJX0BX5Kw32ax9NukYcTW01fPTeRzXY6jRXCvOjaX405sSnMWqMy7fjqkrtsKCrxTpuLO5qQdvFuhvEMnB7b335b/s+GcRstFlM0+JklBeLJGPYydkqz+5Wm+IhmWFfchs9d9rSebakLM9fsvmy7Td/XOZF2vvJiun9Y5//NC/uO9FfkyxrCSt3cLWkaodtSeti3npPiiJ/bSmLZP3UEhpbbStSuly3E1gn7RST56TT26Ie827AfjB3xwrHpPp/TP6lY9L+Au+3Dss3OZL+rXTc6s2L3tKH3FP9UHurnPSjQod+VNK2w+OqhtpT2FC7tQ3puLwhHlU4tF8UuY3arXObVbfUbVdH1W67ahZ8PBn8BA==",
        },
    ],
});
