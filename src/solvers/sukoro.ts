import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number between 1 and 4 into some of the cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 4));

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Each number is equal to the amount of (up to 4) orthogonally adjacent cells that also contain a number
    for (const [p, arith] of grid) {
        cs.add(
            Implies(arith.neq(0), arith.eq(Sum(...puzzle.points.edgeSharingPoints(p).map(p => grid.get(p).neq(0)))))
        );
    }

    // Identical numbers cannot be orthogonally adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(p).neq(grid.get(q))));
    }

    // All numbers form an orthogonally contiguous area
    cs.addAllConnected(puzzle.points, p => grid.get(p).neq(0));

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value !== 0 && !puzzle.texts.has(p)) {
            solution.texts.set(p, value.toString());
        }
    }
};

solverRegistry.push({
    name: "Sukoro",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wI+kSblnX7JKxdclUVQhFTkIbVIg7A+vkKP9733tmIgYmbYdtPUwOT18+ftjPsb8uv9ZCpXwMLZhwl3vQfH9Cz8jF34+2yqo8DS/4rK72UoHg/ON8zu9FXqZO3GQlzlFPQ33D9fswZh7jzIfHYwnXN+FRfwh1xPUSuhj3gC1Mkg/yupW31I/qykDPBR01GuQdyG2mtnm6XhjyKYz1ijOc5y19jZIV8lvKmjrwfSuLTYZgIypYTLnPnpqest7Jx7rJ9ZIT1zNT7nKg3KAtF6UpF9VAubiKP1zuNDmd4G//DAWvwxhr/9LKSSuX4RFiFB6ZP8VPYWc8szcs8BEELRhNEIzOAH2Ci2vApWsBGNmj8e8ozin6FFcwPdcBxXcUXYpjigvKuaZ4S/GK4ojiJeW8wQX81hL/Qjmxb9yCbfxrKnFiFtXFJlUXkVSFyBn4hZUyX5e1uhdb2H2yE2wwsANlWiiX8inPDnZe9nCQKh3sQpjuHobyN1LtOqM/izy3gLkcLGTOsYUqBYf07F0oJZ8tUohqb4GzA22NlB4qu4BK2CWKR9GZrWjXfHLYd0ZPHMBlFPy/jP7RZYRb4L42v762cuj0SjVofcAD7gc66PKG94wOvGdpnLDvaqADxgba9Tagvr0B9hwO7Ccmx1G7PsequlbHqXpux6nODR8nzgs=",
            answer: "m=edit&p=7ZTfb5swEMff+SsqP/sBDKQJb13b7CXL1iVTVaEochLaoELcGVgnIv73nQ8SsGFS97AfD5PD6fLx2Xdn+Dr7WnAZUR+GO6Y2dWAwNsbHs9XvNJZxnkTBBb0q8r2Q4FD6cTqljzzJIitsolbWsZwE5R0t3wchcQglDB6HrGh5FxzLD0E5p+UCpgh1gM3qIAbubeve47zyrmvo2ODPGx/cB3C3sdwm0XpWk09BWC4pUXne4WrlklR8i0hTh/q/FekmVmDDc2gm28cvzUxW7MRzQU4pKlpe1eUuBsp123Ldc7nucLns95c7WVUVHPtnKHgdhKr2L607bt1FcKxUXUfCJmopvBmnfjfEZQq4LfDGCngdMDkdTgNGtgZgZwf3f0A7RcvQLiE9LV20N2httD7aGcbcor1He43WQzvCmEvVALTY3WPUW42dnapip87sprMzcJrez8A1wcQAnrnEY8am3qWR1jeX+HrE+bjqo1h0jq4+LnUUlRWyWpFq+G/zVlZI5kW6ieTFXMiUJwQ0STKRrLNCPvItfGEoWYrsgJEaSoR4SeKDHhc/HYSMBqcUjHZPQ/EbIXfG7q88STSQ4QWkoVorGsplrP3nUopXjaQ832ugIxptp+iQ6wXkXC+RP3MjW9r2XFnkO8EndOHCc/9feH/pwlOvwP6la++PXFH/Vjn49Qo5KH3AA+oHOqjyhveEDrwnaZWwr2qgA8IGamobUF/eAHsKB/YTkatdTZ2rqkypq1Q9tatUXcGHK+sH",
        },
    ],
});
