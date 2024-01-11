import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade several cells in the hexagonal grid
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Each shaded cell must have at least one shaded cell below it (unless it's on the bottom row)
    for (const [p, arith] of grid) {
        const belowCells = puzzle.points.edgeSharingPoints(p).filter(q => q.y > p.y);
        cs.add(Or(arith.eq(0), belowCells.length === 0, ...belowCells.map(q => grid.get(q).eq(1))));
    }

    // There can not be a horizontal run of 3 or more shaded cells
    for (const [p] of grid) {
        for (const bearing of puzzle.lattice.bearings()) {
            if (bearing.from(p).dy === 0) {
                cs.add(Or(...bearing.line(p, 3).map(q => grid.get(q)?.eq(0) || true)));
            }
        }
    }

    // A number indicates the amount of shaded cells around it
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...puzzle.points.edgeSharingPoints(p).map(q => grid.get(q))).eq(parseInt(text)));
    }

    // Cells with numbers cannot be shaded
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
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
    name: "Tawamurenga",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTBb9owFMbv/BWTzw8pToBBbl1XdmFsHUxVFSFkIC1RE8ycZO2C+N/73kum1El22GFVD5Px4/GLnfcZ+/Pxl1FJtIMhNQcckNg8x+E+4M/vtoyyOPTfwUWe7bXBBODLdAp3Kk7DXuCseqdi4hfXUHzyAyEFCBe7FCsorv1T8dkv5lAs8JEAiWxWDnIxvarTG35O2WUJpYP5vMoxvcV0G5ltHK5nJfnqB8USBNX5wLMpFYn+GYpKB/3e6mQTEYijQ/hUwTTf6Ye8GiZXZyguSqWLDqVerZTSUillHUppAf9O6WR1PuOf/Q21rv2AZH+v03GdLvwTxrl/Eq6kqbgfstwR4Q4awOMRXg0GYwLDGgxHjSkjxwJYSnLBW45Tji7HJeqBwuP4kaPDcchxxmOuON5wvOQ44DjiMe9pRX+15leQE7gujHH11CWMONbfEvreBPoSJtgGmDjQn+A56AXoFJHqeJ3m5k5tcfPZQrjJyA55sgmNhWKtj3QWLBjdH7QJOx8RDHf3XeM32uwab39UcWyB9EeujD25PMYWygye0Re/lTH60SKJyvYW2KgML5B0Hx3tN4WHzBaQKVuielCNakm95nNPPAnugYeXlPf/GnrVa4j+eOetGfOtyeEzq02n4RF3eB5pp7cr3rI38paRqWDby0g77Iy06WhEbVMjbPka2R+sTW9tuptUNQ1OpVoep1IvbR6ses8=",
            answer: "m=edit&p=7ZTPb5swFMfv+Ssmnx0JMKSBW9c1u2TZumSqKhRFTkIbVAiZgbUj4n/fe89pqYEdemi1w+Tw/Pj419fEXx9+K5nGW+5hsbjFbSjCsuhx6fdUFnGRRMEHfl4Wu0xBwvnXyYTfyiSPBqG1HBwrP6iuePU5CJnNOHPgsdmSV1fBsfoSVDNezaGJcRvYVHdyIL1s0mtqx+xCQ9uCfHbKIb2BdBOrTRKtppp8C8JqwRmu85FGY8rS7FfETjrwfZOl6xhBEu+jxxPMy212X7Kn2WtenWul8x6lolEqnpWKfqXOmyr1l3UNH/s7aF0FIcr+0aTjJp0HxxolHZlj41D4P2z9jzDHbQFBPUQD3DECrwHeqDVkZBkAlrJpwRuKE4oOxQXo4ZWg+ImiRdGjOKU+lxSvKV5QdCmOqM8Z7gj2/HKOUWf0jKJWoVeY4+ZBJ0h0hK58qoSjK/3m6i6uhu6ZrnSbp9s8DT2Ez5vUG0PR9SB0HD6GbzEmC40oNrXNh8LnQ5v7UFxILD704VQMQvANy7NklZfqVm7gKJChOLF9ma4jZaAkyw54MgwY3+0zFfU2IYy2d33915natmZ/kEligPxnKZU5WB9qAxUqNt6lUtmDQVJZ7AywlgVcJ/kuPpgzRfvCFFBIU6K8l63V0mbP9YA9MnpCAVeW+H8pveulhB/eetXV9C63xr8lh85spnoND7jH80B7vX3iHXsD7xgZF+x6GWiPnYG2HQ2oa2qAHV8D+4u1cda2u1FV2+C4VMfjuNRLm8O1+Qc=",
        },
    ],
});
