import { zip } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // You're given a board divided into rooms
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded cells cannot be horizontally or vertically adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
    }

    // A number indicates the amount of shaded cells in a region
    const regions = puzzle.regions();
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...regions.get(p).map(q => grid.get(q))).eq(parseInt(text)));
    }

    // There cannot be a horizontal or vertical line of unshaded cells that goes through 2 or more region borders
    for (const [p] of grid) {
        for (const bearing of puzzle.lattice.bearings()) {
            const line = puzzle.points.lineFrom(p, bearing);
            for (const word = []; line.length > 0; word.push(line.shift())) {
                if (zip(word, word.slice(1)).filter(edge => puzzle.borders.has(edge)).length >= 2) {
                    cs.add(Or(...word.map(p => grid.get(p).eq(1))));
                    break;
                }
            }
        }
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
    name: "Heyawake",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRfb5s8GMXv8ykqX/sCMNCWu65Ld9Nl69qpqhCKSErbqCTuHPJ2Isp373keTAl/plfbNK0XE8L6cTB+jo2P1982qclkiEsdSUe6uLww5Nv1fb4de10tijyLDuTJpnjQBiDlp7MzeZfm62wU217JaFseR+WFLD9EsXCFFB5uVySyvIi25ceoHMvyEq+EdKGdV5084LjBa35PdFqJrgOeWAbeAOcLM8+z6XmlfI7i8koKqvOOvyYUS/1fJqwPep7r5WxBwiwtMJn1w+LJvllvbvXjxvZ1k50sTyq7lwN2VWOXsLJLNGCXZvGH7R4nux2W/QsMT6OYvH9t8KjBy2iLdhJthefRpz68VP9G+CyQ9VpQXSEkwWmEsNsj9EnA764ElHK54A23Z9x63F7BjywVt++5dbgNuD3nPmPYdBX2o4I1DyMqD4yazAqMcszYpSqwHIBhlBk7WB1W7II9q3ukW/YxZmDHD8Ch5RB1a6a6tDx1f1oZZnjw9zzUTKkJLAfo88pUq/YPn7717IMDywF9WzPp1mcAz4GdC41Ja88+wYc1k39iLN41L+Eptz63IS/tIW2En9oqv/8X/9dO7MH564VZ/yono1iMb++zg4k2yzRHVCab5Swz9TPOJrHW+XS9MXfpHEnjowthgrbini0p1/opX6za/Rb3K22ywVckZig/0H+mzW1n9Oc0z1tCdRS3pOrMaEmFwYGw95wao59byjItHlrC3uHRGilbFW0DRdq2mD6mnWrLZs67kfgu+I4VDn717+D/Swc//QLnrWX6rdnh3avNYPQhD6Qf6mDKrd4LOvRepKlgP9VQB4INtZttSP14Q+wlHNoPQk6jdnNOrrpRp1K9tFOp/cDHyegF",
            answer: "m=edit&p=7VRNb5tAEL37V0R73oPZLyfc0tTpJU2bOlUVIcvCNklQsEkBNxUW/70zs4sxH5X6oao9VIjdx2PYeezOm/zzLswibuCSp3zMPbiEMXR7StE9dtdtXCSRf8LPd8VjmgHg/N3lJb8PkzwaBS5qPtqXZ355w8s3fsA8xpmA22NzXt74+/KtX055OYNXjHvAXdkgAXDawE/0HtGFJb0x4GuHAd4BXMXZKokWV5Z57wflLWeY5xV9jZBt0i8RczrweZVuljESy7CAn8kf42f3Jt+t06cdq1NUvDy3cmcDcmUjVx7kymG54s/LPZtXFWz7BxC88APU/rGBpw2c+fsKde2ZEPipAi32bJgS9a/XhOwSBolxQ5huhFFIiJqAVB4lvKPxkkZB4y3o4aWk8TWNYxo1jVcUMwWZnoR6lCBNwIpSAJYOS8DKYahSqR3WgI3DUMFyYrEHWDhemCZGwZrara8BG4eN12DMq0QTr5wGJdEdjYYao2u0w1oeYcwlG53KaVaAtcNaHWHknU4NmvWkWdO4dQzgSY2F4yusSNzCCxoVjYa2doKFAKVyvPWmvem2Qg6HZw9m5moGTlZomvAkcDI04b/DpG2ItiHGhpgJTRMkD9VgKwBlVqNACOo79tK/juejgE3XD9HJdZptwgSscr3bLKOsfobexPI0WeS77D5cgdOodXHithTZopI0fU7ibTsuftimWTT4CskI0g/EL9Ns3Vn9JUySFpFTK25Rtme0qCKLW89hlqUvLWYTFo8t4qh5tFaKtkVbQBG2JYZPYSfbpvnnasS+MroDCY1f/m/8f6nx4xGMf6r9/35n/oEW82/JoepNs0HrAz3gfmAHXe74ntGB71kaE/ZdDeyAsYHtehuovr2B7DkcuO+YHFft+hxVda2OqXpux1THhg/mo28=",
        },
    ],
});
