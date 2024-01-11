import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Iff, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions, where each region represents a snake
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    const [_, paths, order] = cs.PathsGrid(puzzle.points);
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Iff(grid.get(p).eq(grid.get(q)), paths.get(p).hasDirection(v)));
    }

    // A snake is a path that is at least 2 cells long
    for (const [p, arith] of grid) {
        cs.add(Or(...puzzle.points.edgeSharingPoints(p).map(q => grid.get(q).eq(arith))));
    }

    // A snake cannot loop back on itself and visit a cell that's orthogonally or diagonally
    // adjacent to a cell it has visited before
    for (const vertex of puzzle.points.vertices()) {
        for (const p of vertex) {
            const lines = range(vertex.length).map(i =>
                grid
                    .get(vertex[i])
                    .eq(grid.get(p))
                    .neq(grid.get(vertex[(i + 1) % vertex.length]).eq(grid.get(p)))
            );
            cs.add(Sum(...lines).le(2));
        }
    }

    // A number indicates the length of the snake, in cells
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                arith.eq(order.get(p).add(1)),
                ...puzzle.points
                    .edgeSharingPoints(p)
                    .map(q => And(arith.eq(grid.get(q)), order.get(q).eq(order.get(p).add(1))))
            )
        );
    }
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // A circle indicates an endpoint of a snake
    for (const [p] of puzzle.symbols) {
        cs.add(paths.get(p).isTerminal());
    }

    // A gray cell must not be on the endpoints of a snake
    for (const [p] of puzzle.shaded) {
        cs.add(paths.get(p).isLoopSegment());
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
        solution.texts.set(p, model.get(order.get(p)).toString());
    }
};

solverRegistry.push({
    name: "Snake Pit",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5swFL7zV1Q++8CP0Kbcuq7ZJcvWJVNVIRQ5idugQtwZWCei/O9975k2GJjWS7UdJoeXx+f347PN5+JHJbTkIYxgzF3uwfD9MT0jF38vY5GWmYxO+EVVbpUGh/Mvkwm/E1khnbiJSpx9fR7V17z+FMXMZ5wejyW8vo729eeonvN6DlOMB4BNwfMY98G9Oro3NI/epQE9F/xZ44N7C+461etMLqcG+RrF9YIz7POBstFlufopmUmj97XKVykCK1HCYopt+tjMFNVGPVRNrJcceH3RoYtdGrrIvKGLrqGL3gBdXMU70z1PDgfY9m9AeBnFyP370R0f3Xm0Z77LooCzwKe/0Zj+wjP4g4AZBgRYdQQ0zbGxADJiFrQAyI1ZeARG3Qgsa9UIKaKVgh1bEdDbi/Zgb18YAG7tGDvFEh0UEiaU5pNdwDJ5HZD9SNYlG5KdUswV2Ruyl2RHZE8p5gw3CrayXcPMtLNhm14Jmw6ws4b8KwvTwXT+w8EcnNg3usMRvs1LnJjNK30n1hI+iVmVr6Q+mSmdiwze51vxKBlokRUqWxZNXERShY8HsB1lWFCm1GOW7uy49H6ntBycQlBu7ofiV0pvOtWfRJZZgLl4LMicrQWVGgTQehdaqycLyUW5tYCWWKxKclfaBEphUxQPotMtP6754LBfjJ44gIsu+H/R/aWLDo/AfeN11xGrEej7XBn/Fh36epUelD7AA+oHdFDlDd4TOuA9SWPDvqoBHRA2oF1tA9SXN4A9hQP2G5Fj1a7OkVVX6tiqp3Zs1RZ8nDjP",
            answer: "m=edit&p=7VVNb5swGL7nV1Q++4BtSIBb17W7dN26dKomFFUkpQ0qCR2QdSLiv/f1a/Nhw6Requ0wkdgPD++XPx67/HmIi4R68AifOpTBw7mPf9eRv/a5SassCU/o6aHa5gUASr9cXNCHOCuTWaStVrNjHYT1Na0/hRHhhOKfkRWtr8Nj/Tmsl7RewidCBXCXgBihHOB5D2/xu0RnimQO4CuNAf4AuEmLTZbcXSrmaxjVN5TIPB/QW0Kyy38lRLnh+ybfrVNJrOMKBlNu02f9pTzc508H0qZoaH1qlcv6ckVfrujKFdPl8vcvN1g1DUz7Nyj4Loxk7d976PdwGR4Jd0goKBEcO9fHzltA18iSwUDIqC6UqZaNCEcSYkBwSXg94doWMqwRw3MsF5lxYAG5WXhs5EzpCoA3ZozMnTELDhfoxrG9gWHSWmD7EVsHWw/bS7Q5x/YW2zNsXWznaLOQEwVTOYwxN70Jc0Aijpo/6AELxIHbQegBuxqDOXN6c8YUZpJvw4Av074MNMgCjQPK9IpBD7j15QMMubiOwyWv4/AFYH8QR2MOWLQxWY8FxBc6ppA8H9j7gw3SrjbXaykLwbXsiHaDdISwXVyiToeOCCxC7bohgVmcAcH19u8IYRO+TQQWoXbuIKjLrLQuty0WNuHbLoE1Ws+eMc+eMW9uBVX6GFTq2Vk8eyxzcyydpJQGlq28Op1IDTSziKsjXz7e29BqFpHloXiINwmcRleH3TopTq7yYhdn8L7cxs8JgWuAlHl2V2q7EG8JitwePQwqy/PnLN2bdunjPi+SyU+STO4fp+zXeXFvRX+Js8wgSrzzDEodKwZVFanxHhdF/mIwu7jaGsTgnDYiJfvKLKCKzRLjp9jKtuvH3MzIb4L/SMAdK/7fsX/pjpVL4LzxplWn5fBie7fb6t8qB3dvXkxKH+gJ9QM7qXLNj4QO/EjSMuFY1cBOCBtYW9tAjeUN5EjhwP1B5DKqrXNZlS11mWqkdplqKPhoNXsF",
        },
    ],
});
