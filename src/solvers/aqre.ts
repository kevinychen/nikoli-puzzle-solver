import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Numbered regions must contain the indicated amount of shaded cells
    const regions = puzzle.regions();
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...regions.get(p).map(q => grid.get(q))).eq(parseInt(text)));
    }

    // There may not be a horizontal or vertical run of 4 or more consecutive shaded or unshaded cells
    for (const [p, arith] of grid) {
        for (const v of puzzle.lattice.edgeSharingDirections()) {
            cs.add(Or(...range(4).map(i => arith.neq(grid.get(p.translate(v.scale(i))) || -1))));
        }
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
    name: "Aqre",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTRT5xMFMXf968w8zwPywyMypta7Yvftn7aGEPIhl1RibBjZ9lq2Oz/7rnDrMBC07RNUx8aws2PwzD3wHBm+XWVmJQrHPKAj7mHQyhlT8/37Tl2x1VW5mm4x49W5YM2AM4/nZ3xuyRfpqPIjYpH6+owrC549TGMmMc4Ezg9FvPqIlxX/4XVhFeXuMW4B+28HiSApw1e2/tEJ7XojcETx8AboH6ZHtdXn8OouuKMehzbJwlZob+lzHmg67kuZhkJs6TEiywfsid3Z7m61Y8rN9aLN7w6qq1eDliVjVXC2irRgFV6A7I6z8w8T6fnf8DuYbzZ4JP/D8PTMCLvXxo8aPAyXKNOwjUTgh7Fqnj1ujCxT8JhI8iAhIOtgOc8+/SNrWe2CluvMDmvpK0fbB3bGth6bsecoqfn4XcSioUCM4qgxfjFBNpZlmDfsQDLhiVME0uw79gHB44DsHKs8BO/MXop10uhl3K9FHop10vRs9te8CndeEkRcOyDA8cBeDsn+ZduHok52+y7OX1w4Jh8blnC21svsO+8+eDAcYD522w946Ne2097Yqtvq7KffJ9W+6f+h99f3R/aiWgF3w683a9yPIrY6e19ujfRpkhy5GGyKmap2V5j82FLnU+XK3OXzBEnuzchMdAWdmRHyrV+yrNFd1x2v9AmHbxFYor2A+Nn2tzuzP6c5HlHqPfajlRvDB2pNEh96zoxRj93lCIpHzpCa4fozJQuyq6BMulaTB6TnW5F886bEXth9owkdnb5b2f/Czs7ff7xe8vze7Nj/1xtBmMPeSD5UAcT7vReyKH34kwN+4mGOhBqqLu5htSPNsReuqF9J+A0627GydVuzKlVL+nUqh32KB69Ag==",
            answer: "m=edit&p=7VVNb9swDL3nVxQ66xDry61vbdfu0mXr0mEojCBwUrc16sSd7ayFA//3kaISR4kH7APDdhgMS89PpPgskVL1ZZWUKTfwyGM+5AE8whj7BkrZd+iem6zO0+iIn67qx6IEwPn7y0t+n+RVOoid1WSwbk6i5po3b6OYBYwzAW/AJry5jtbNu6gZ8WYMQ4wHwF2RkQB40cHPdhzROZHBEPDIYYC3AIvX6Rl9fYji5oYzjHFmPRGyRfE1ZU4Dfs+LxSxDYpbU8CPVY/bsRqrVXfG0YpvpW96cktRxj1TZSZVbqbJfqnBS51k5z9Pp1R+QezJpW1jyjyB4GsWo/VMHjzs4jtYt6lozIdAVdiWgfWEiROKkI6RG4nhDgF9gvW9te2lbYdsbmJw30rZvbDu0rbbtlbW5gJhBAOkkDIsEzCj0DoYUE9phCVg5LADLDktBWAJWDivA2mEN2Dhsgh0MsYyLZSCWcbEMxDIulkHfTSzQKZ29xBJwWAHWDmvTzYn6pZtHSh8rN6cCrGWnc4Ol3okFWDltCrB2WCsfW80tph0u7bltlW2NXfIQdxvyYXdLjL8ZlAbbTaUNG2NigK6A0gE6XHHsiMSUwM5QRyaKxpSijkwUjWkiNZGa/Aw5GBozjiSHkOKFZBKSX0gmIZpsE5CSDlegHcSYHNtH/zqeDGJ2cfeQHo2KcpHkUGqj1WKWlptvONdYVeTTalXeJ3OoVHvsccstraVH5UXxnGdL3y57WBZl2juEZArhe+xnRXm3N/tLkuceUdlj3KPozPGousy876QsixePWST1o0fsHD7eTOmy9gXUiS8xeUr2oi26f24H7JXZN5Zwacj/l8ZfuDRw+Yc/dXX8/kXwAyfXvyXHZm5R9pY90D2VD2xvhTv+oMiBPyhnDHhY0cD2FDWw+3UN1GFpA3lQ3cB9p8Bx1v0aR1X7ZY6hDiodQ+0WezwZfAM=",
        },
    ],
});
