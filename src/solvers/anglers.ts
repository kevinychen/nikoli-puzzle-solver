import { Constraints, Context, PointSet, Puzzle, Solution } from "../lib";

const solve = async ({ Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines so each person (represented by a number) is connected to a fish
    const points = new PointSet(puzzle.lattice, [...puzzle.points, ...puzzle.texts.keys()]);
    const [network, grid, order] = cs.PathsGrid(points);
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.neq(0), Or(arith.isLoopSegment(), order.get(p).eq(0)).neq(puzzle.texts.has(p))));
        cs.add(arith.isTerminal().eq(puzzle.texts.has(p) || puzzle.symbols.has(p)));
    }

    // A number shows the length of the connected line
    for (const [p, text] of puzzle.texts) {
        if (text !== "?") {
            cs.add(order.get(p).eq(parseInt(text)));
        }
    }

    // All unshaded cells must have a line
    // Shaded cells are obstacles
    for (const [p, arith] of grid) {
        cs.add(arith.eq(0).eq(puzzle.shaded.has(p)));
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
    name: "Anglers",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVLb9s8ELz7VwQ886BH7Mi6FGma9JI6X2oXQSAIBu0osRDJdCmpKWj4v2eWkqFn0VzytYeC1mI0XJJDijvOvhdCRfwMzfW4xW001zo1z8Si37Et4jyJ/BN+XuQbqQA4v7m64o8iyaJRQOPQwtFeT319y/VnP2A248zBY7OQ61t/r7/4es71HF0MuVxfl0kO4GUN70w/oYuStC3gWYUB7wHzaJtn5et/fqAXnNEiH81QgiyVPyJWiaD3tUxXMRErkWMn2SbeVT1Z8SCfiyrXDg9cn5daZwNa3VorwVIroQGttAXSuo7VOomW1+8gdxoeDjjzrxC89APS/q2GXg3n/p65HvNt4BmwM6YJPCgqPw9z0BmwcU1MDIHPdyQ8M8StialLxIcjgZltf494j/lPp+hzeeMzsYnTozyrT9l9itZpUljjyqzkmLjAFrl2TfxkomXi2MRrk3Np4p2JFyaemjgxOWd0SG88xvIAm5t9JzmBOymLCu3sbSgcBWxeqEexjnBZZkW6itTJTKpUJHifb8QuYihRlslkmVV5vqlgXCtwWzOiRSVS7pJ4286Ln7ZSRYNdREYPT0P5K6keOrO/iCRpEaUftaiyelpUrlAajXehlHxpManINy2iUUatmXCn2gJy0ZYonkVntbTe82HEfjLz4IJa8IF//vcH/I/O3/rbyvc3cgLcBPzj6hvOdsVSLNcSJYqzC3Dqzpgbb3Yqox1K6Awse4amRM//vnVTJlINegzoAZsBO2gnFd9zFPA976AF+/YBdsBBwHZNBFTfR0D2rATcL9yEZu0aCqnqegot1bMVWqrpLEE4egU=",
            answer: "m=edit&p=7VZLb5tAEL77V0R7ngPs8li4VGma9JI6TZ0qqpBlYYfEKNi4PJoKi//e2VlszKNVLmkvFWb08e3M7Ows++H8exlmEbh4CQkGmHgJw6LbMdTvcN3FRRL5Z3BeFus0QwBwc3UFj2GSR5PApEhzPtlXnl/dQvXRD5jJgHG8TTaH6tbfV5/8agbVDIcY+kJ1rZ04wssW3tO4QheaNA3E0wYj/IawiLZFrh8/+0F1B0xN8p5CFWSb9EfEmiLU8yrdLGNFLMMCV5Kv410zkpcP6XPJDvlrqM51rdORWkVbqzjWKsZr5U2tqzhbJdHi+g3K9eZ1jT3/ggUv/EDV/rWFsoUzf8+EZL5Zq+r2jNsqgcSK9PYwLhVht4RDBG8JSSGiJTyhiHcHAjOb/r5WS94zy8MxASfbxBw+oKQxpMwhJXoUznFFM3Gyd7hEqATZD2QNsjbZa/K5JHtP9oKsRdYhH1c1Cdt4msM5RGOvQDjMxwqEA8LVyAVLEuIShKc5DyyDkGWAbWp09ENkN8gDW/vZRz9bgq2z2B64elSdP/OA3AaZ4HKNOLhCIwmOjnU8kDrWNUDqCNcEqSNcDlJHuAKkRUhy8DQnLVA7LI7NmpLVW6obOjts77HpqqH1JMC+NAKAOvIqNJ8EbFZmj+Eqwtd6Wm6WUXY2TbNNmODzbB3uIoZiwvI0WeSNn09aA8RtKaJDJWm6S+Jt1y9+2qZZNDqkyOjhacx/mWYPvewvYZJ0iJyUs0Ppc96hiizuPIdZlr50mE1YrDvEyYHvZMK3v1tAEXZLDJ/D3mybds31hP1kdONRMlCx/iv1P1Bq1X/jlXrdO4L62L2N7v2xnADfBPxvUN0A25WLcLFK8Yhi7wLsOkojfUV480kYc+gF6pGxlDjy15dOxyTNRjUG6RGZQXZUThp+oCjID7RDTTiUD2RHFATZvoggNdQRJAdSgtxv1ERl7QuKqqqvKWqqgayoqU6VJZhPfgE=",
        },
    ],
});
