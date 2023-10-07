import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap, Vector } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw an orthogonal line in every cell, connecting two opposite edges and going through the center
    // 1 = HORIZONTAL LINE, 2 = VERTICAL LINE
    const grid = new ValueMap(puzzle.points, _ => cs.int(1, 2));

    // There cannot be a run of 3 or more parallel lines
    for (const [p] of grid) {
        cs.add(Or(...range(3).map(i => grid.get(p.translate(Vector.E.scale(i)))?.neq(1) || true)));
        cs.add(Or(...range(3).map(i => grid.get(p.translate(Vector.S.scale(i)))?.neq(2) || true)));
    }

    // Numbers indicate either the amount of cells with a horizontal line, the amount of cells with
    // a vertical line, or both
    const regions = puzzle.regions();
    for (const [[p], text] of puzzle.edgeTexts) {
        cs.add(
            Or(
                Sum(...regions.get(p).map(p => grid.get(p).eq(1))).eq(parseInt(text)),
                Sum(...regions.get(p).map(p => grid.get(p).eq(2))).eq(parseInt(text))
            )
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved symbols
    for (const [p, arith] of grid) {
        solution.symbols.set(p, new Symbol("line", model.get(arith)));
    }
};

solverRegistry.push({
    name: "Juosan",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRfT9s+FH3vp0B+9kNsp9DmjTHYC+vGYEIoiqq0BKhIa35uOqZU/e6ce+PS5s+0adP042Fye3V8fHPvceLj5X+r1GWyj2EGMpAKQ+sB/8OAfttxNSvyLDqQx6viwToAKT+dncm7NF9mvdhnJb11OYzKC1l+iGKhhBQafyUSWV5E6/JjVI5keYklIRW48ypJA57u4DWvEzqpSBUAj4BN9dgN4HTmpnk2Pq+Yz1FcXklBfd7x0wTF3H7LhNdB86mdT2ZETNICm1k+zJ78ynJ1ax9XPlclG1keV3IvO+SanVyClVxCTbl+P39Z7jDZbPDav0DwOIpJ+9cdHOzgZbRGHHFU0VqEQUgVqncqQnX4un3MwmB/LaxlhoP92YDXwmrW7+vXGdrccLMzjprjFbTI0nB8zzHg2Od4zjmnEKcCnMVAiUjj+AQ4lQEKM9bAxmMDjPaMQ+A+4yHBbQrSlS+jUEb5Mop4n6NQRm3LUA72zjwkqKHHQ6k09k0Y1lDa8xo5W0z1tX+WcsyRx3jWeN4g33g9BvmG9GDP17zzE44hx0N+I0f07X7j6/7Jy/+pnJh27Uf/11DSi8Xp7X12MLJunuY4x6PVfJK57RwXh1jafLxcubt0ChvwvYKTDm7BmTUqt/Ypny3qebP7hXVZ5xKRGdp35E+su21Uf07zvEZUt2SNqgxdowoHt+7NU+fsc42Zp8VDjdhzdq1StijqAoq0LjF9TBvd5rs9b3riu+B/bHArm3+38v90K9MnCN6ae9+aHD691nVaH3SH+8F2utzzLaODb1maGrZdDbbD2GCb3gbVtjfIlsPB/cDkVLXpc1LVtDq1armdWu0bPk56Lw==",
            answer: "m=edit&p=7VVNb9NAEL3nV1R73sN+ObF9KyXhUgKlRQhZUeWkbmvViYvtUOTI/70z623sSYxUgRAckJPRm7ezs28/Zrf8to2LhHvwaZ8LLuFTyrd/I/D38l2lVZaEJ/x0W93nBQDOP8xm/DbOymQUuajFaFcHYX3B63dhxCTjTMFfsgWvL8Jd/T6s57y+hCbGJXDnbZACOO3gF9uO6KwlpQA8B6zbbl8BrtJilSXX5y3zMYzqK85wnDe2N0K2zr8nzOlAf5WvlykSy7iCyZT36aNrKbc3+cPWxcpFw+vTVu7lgFzdydV7uXpArpvPH5YbLJoGlv0TCL4OI9T+uYN+By/DXYO60Mpwx4wwbL+mzMjxfvrgGdFvMyTS+H3Pt22m9TxP7b0GZ46DzaxV1l6BFl5ra99aK6z1rD23MVMQJwWcRSFZqOD4CDiVQjmsAGuHNWDjsAHsWRyYXgiES5dGQhrp0kjkXYyENNJ0Q0nheJAgA4cDLpXfYigNqRyvRIcxvxJdjJ44DH214zXEa6dHQ7xGPQ0eIpz5mbXG2rFdkQnuHexuf8XGdK36m9q8rGe72bD+DBVFCuLtBilJPEU8WI9I7j1D2oJ+G86m55GcmuTUmng+8UhOQ3IaktMo0jYhnk+8oN/PIzk9Sbwx8SakH9HpkZzj3nruDzRuXzOKVHuB4ue9Di1GEZve3CUn87xYxxnU93y7XibFiw8XKivz7LrcFrfxCq4He99yy21sJKGyPH/M0g2NS+82eZEMNiGZwPAD8cu8uDnI/hRnGSFK+3oQqr3oCFUVKfHjosifCLOOq3tC9G48kinZVFRAFVOJ8UN8MNq6m3MzYj+Y/UcaXiv9/7X6S68VboH4hTfrd56UV1yy/5Yce3rzYrD0gR6ofmAHq9zxR4UO/FFJ44DHVQ3sQGEDe1jbQB2XN5BHFQ7cT4ocsx7WOao6LHUc6qjacah+wUeL0TM=",
        },
    ],
});
