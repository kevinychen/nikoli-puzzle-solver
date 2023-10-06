import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Fill every thermometer from the base (circular part), towards the top
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    for (const thermo of puzzle.thermo) {
        for (let i = 1; i < thermo.length; i++) {
            cs.add(grid.get(thermo[i - 1]).ge(grid.get(thermo[i])));
        }
    }

    // The numbers around the grid indicate the number of filled cells in that row/column
    for (const [p, v] of puzzle.entrancePoints()) {
        if (puzzle.texts.has(p)) {
            const number = parseInt(puzzle.texts.get(p));
            cs.add(Sum(...puzzle.points.sightLine(p.translate(v), v).map(p => grid.get(p))).eq(number));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved filled cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Thermometers",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRPb9s8DIfv+RSFzjxYlv/fuq7dpcvaNUNRCEbgpG4T1I76Ks46OMh3L0lniO14A4Z3w3oYHDP0Y8qkRP20/m+T2RxCvFQEDki8lOPxHTj0+35NllWRJydwuqkWxqID8OniAh6yYp2PtOSxTjra1nFSX0P9IdFCChAu3lKkUF8n2/pjUl9BfYOvBEhkl02Qi+5540YO+rccQPSsoZLoeO+je4fufGnnRT69bMhVousJCEr0jkeTK0rzNRf7Quh5bsrZksAsq3A268Xyef9mvbk3T5t9rEx3UJ829d4M1KsO9ZLblEveQLk0iz9cbpzudrjun7HgaaKp9i8HNzq4N8kW7TjZCtenodga2TRHuAEB1QJhPyIi4LVA3BuinD7gLC3gcRZaoD3wOUsrIuAs/gGEnKVVR9zNghOSPK07thdsXbaTRGsVgBeCF4EXp6AVb3IVg++Aj23QgQLfBU+Chx3TkYLIg8iH0MOnOIDYp38PYgWxC7HE3QkRWuypDmIIHQglhC6ECgIXAkly8fHrUYp9VbjoUL9n67D12V5ycedsb9mesfXYBhwTUsN+qaU/X4ffUg4tJh0PzfU//HSkxXhTznJ7Mja2zArc1JNFbksj8PwQa1NM1xv7kM1RDHy84H5HtuIhHVQY81wsV9245ePK2HzwFcH8/nEofmbsfe/rL1lRdEBzWHZQI+sOqixqtvWcWWteOqTMqkUHtPTd+VK+qroFVFm3xOwp62UrD3PejcQ3wbdWeDyrf4fz3zqcqQfOW9PzWyuHt6+xg9pHPCB/pIMy3/MjpSM/0jQlPJY10gFlI+2LG9GxvhEeSRzZD1ROX+0Lnarqa51SHcmdUrUVr9PRKw==",
            answer: "m=edit&p=7VTfb5swEH7PX1H5+R4wNhjz1nXtXrqsXTNVFUIVSWmDCqEjZJ2I8r/vfKZN+LFJ0zZtDxNwd/589p19fLf+vEmqFBQ+IgAHOD7CkfT5jnlfnllW52l4BMebellWaAB8ODuD+yRfp5OI01onnmwbHTaX0LwLI8YZMBc/zmJoLsNt8z5sLqC5wikGHLFz6+SieWrNwEH7mhwMemJRbtBpa6N5g+YiqxZ5entukYswambATKA3tNqYrCi/pKxNxIwXZTHPDDBPajzNepk9tTPrzV35uGEvIXbQHNt8r0byFft8xWu6Yjxd98+nq+PdDu/9IyZ8G0Ym9097M9ibV+F2Z/LaMtczS7E03BaHub4BxAGg+h6BAeQBoHtLhNMHvB4g/ZcLbgFP9Tx8iuLtAaV7eehuFDwQp2PdkDwj6ZKchVEkfJAKZABSxxAJ+smFBs8BD8sQ+QI8FyQHiRWLAgGBhMADJXGkfdCe0RK0AO2C5vh3QoDSNUs1KAcUB+WCEuC74HNDFw93D2Ksq8BLh+YtSYekR/KckjsleU3yhKQk6ZOPMgXDkh7u4Q9WT0na49sIWGEm8JLxboQiJTkpzyXl25HfjoRVmpRyrLIuyroo6xK0SpLSdk5bUBvwtQAzysOcazcxt89fn1+w40nEpptinlZH07IqkhxZMFumVVEybDhsXea36011nyyQPdSPgLAVLelAeVk+5dmq65c9rMoqHZ0yYHr3MOY/L6u73u7PSZ53gDV11w5k+0AHqqusM06qqnzuIEVSLzvAQUPo7JSu6m4CddJNMXlMetGK/Zl3E/aV0RcJ7Ofifzf/W93c1MD5qZ7+40b4m/rRv5UO/b5lNcp9hEfoj+gozVt8wHTEB5w2AYe0RnSE2Yj2yY3QkN8IDiiO2HdYbnbtE91k1ee6CTWguwl1yPgonnwD",
        },
    ],
});
