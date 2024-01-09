import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({ If, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a loop that goes through every cell
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);
    for (const [_, arith] of grid) {
        cs.add(arith.neq(0));
    }

    // A number indicates how many times the loop turns inside the outlined region
    const regions = puzzle.regions();
    for (const [[p], text] of puzzle.edgeTexts) {
        cs.add(Sum(...regions.get(p).map(q => If(grid.get(q).isStraight(), 0, 1))).eq(parseInt(text)));
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Detour",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRfT9s8FMbv+ymQr30R/0mA3DFWdsO6MZgQiiqUlgAVac3cdLxK1e/Oc04MbdpMr7ZpGhdTlKOfnxzbx3Yez78tcl/IRMbSHMhIKjw6SaTWB9Ioy28UnotJVRbpnjxaVPfOA6T8dHIib/NyXvSykDXsLevDtD6T9Yc0E0pIofEqMZT1WbqsP6Z1X9bn+CSkgnbaJGlgf42X/J3ouBFVBB6ATdPtCjie+HFZXJ82yuc0qy+koHnecW9CMXXfCxHqoPbYTUcTEkZ5hcXM7yeP4ct8ceMeFiFXDVeyPmrKPe8o16zLJWzKJdouN6znD5d7OFytsO1fUPB1mlHtX9d4sMbzdIk44KjSpbCJpREslyRio6mF4+LWfkIt3m+kX3GnE46a4wXGlLXh+J5jxDHmeMo5fUyiIi2VwtAav4EiNoENGAUwW6l0YA39lZGvQz4xlUhswDawBceBqa8J+QZsA1viMKbFXDYOOWATWMdt1tgA5gR6YBrThHEi5KiQr4hDjkL+S18DtoEt8X5g5MfUF5t0yVt1zNFyTHgL9+nQfuFYf+e0/recjE7h9cEqfoaHvUz0b+6KvYHz07zErzxYTEeFf2nj7hBzV17PF/42H8MJfLXgZ4c248yWVDr3WE5m7bzJ3cz5ovMTiQWm78gfOX+zNfpTXpYtobkqW1Lj6ZZUeRh2o517755ayjSv7lvChrlbIxWzql1AlbdLzB/yrdmm6zWveuI/wW9mcDGbfxfzX7qY6Qiit+bjt1YO/73Od1ofcof7oXa6POg7Roe+Y2macNfVUDuMDXXb25B27Q1xx+HQfmByGnXb51TVttVpqh2301Sbhs+GvWc=",
            answer: "m=edit&p=7ZVNb9swDIbv+RWFzjxEoqS0vnVdukvXrWuHoTCCwknd1qgTd06yDg7830dKch0nHrAPDNthMCw8fk1SFC3Ky8/rpEzBggE8hCFIupS1oNQhoNTuHobrKlvlaXQAx+vVQ1ESALw7PYW7JF+mgzhYTQab6iiqLqB6E8VCChCKbikmUF1Em+ptVI2huqRXAiRpZ95IEY5b/OTeM514UQ6Jz4nRu10TzrJylqc3Z155H8XVFQie55XzZhTz4ksqQh78PCvm04yFabKixSwfsqfwZrm+LR7XwVZOaqiOfbqXPelimy6+pIs96Yb1/OF0jyZ1TWX/QAnfRDHn/rHFwxYvo03NefEoo43QVnME7VISBhU/qfA0sqKpd80rYKdTNyo3XlFMqNCNr904dKNx45mzGdMkcqhASgqtaBtIZgyMxDqwBqkCK9xislfYMoY4SKwDa2KjWl8M9kisA2vmEFPTXNoEG2IMrEyXlQ1sSbdtTAxxhmQjg71kDjbStr5IrANr5lFgsjfsW/Pu4VKduFG70boSjvij0WfdLrFtiiuoGlwYBCYuCxMCF45JgzKeqLEDUVePGuIFMY0AvUYVRR+P1og+ClVHBzKNB45Aew+qu8aGjM+A6myCpsF4X1qrtg0ZnwvVIkQxCqz3Ndh4GLLzHoYOpmA3AuvJkoefwyJY72E1WB/ZGrDel04x5+H34fbGr5u96hviems/88eoBzHvtZfL/BxPBrEY396nB+dFOU9yatjz9Xyals0znZBiWeQ3y3V5l8yo390BCk5bOMuOlBfFU54tunbZ/aIo095XLKY0fY/9tChvd6I/J3neEZbuh9CR/MnVkVZl1nlOyrJ47ijzZPXQEbaOsE6kdLHqJrBKuikmj8nObPN2zfVAfBXujpF+P/j/9/OXfj/8CYa/8BP6nX/LDxye/1Y6bvcWZW/rk9zT/aT2dnnQ9xqd9L2W5gn3u5rUnsYmdbe3SdpvbxL3Opy07zQ5R93tc85qt9V5qr1u56m2Gz6eDL4B",
        },
    ],
});
