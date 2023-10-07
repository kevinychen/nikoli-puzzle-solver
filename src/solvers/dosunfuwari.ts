import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap, Vector } from "../lib";

const solve = async ({ Implies, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place iron balls (shaded circles) and balloons (unshaded circles) in some of the empty cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 2));

    // Each outlined region contains exactly one iron ball and one balloon
    for (const region of puzzle.regions()) {
        for (const i of [1, 2]) {
            cs.add(Sum(...region.map(p => grid.get(p).eq(i))).eq(1));
        }
    }

    // An iron ball not in the bottom row must be above another iron ball or a shaded cell
    for (const [p, arith] of grid) {
        const q = p.translate(Vector.S);
        if (grid.has(q) && !puzzle.shaded.has(q)) {
            cs.add(Implies(arith.eq(2), grid.get(q).eq(2)));
        }
    }

    // A balloon not in the top row must be below another balloon or a shaded cell
    for (const [p, arith] of grid) {
        const q = p.translate(Vector.N);
        if (grid.has(q) && !puzzle.shaded.has(q)) {
            cs.add(Implies(arith.eq(1), grid.get(q).eq(1)));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved iron balls and balloons
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value) {
            solution.symbols.set(p, new Symbol("circle_L", value));
        }
    }
};

solverRegistry.push({
    name: "Dosun-Fuwari",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZXRT9swEMbf+1cgP/uhjp0U8sYY7IWxsTIhFFUoLQEq0oal6ZhS9X/nu8uFJm3QpmnTeJiiXH79fLHPtT9n8W0Z54kOcNl93dcGlxcEfBvn+O7LdTEt0iTc04fL4j7LAVp/OjnRt3G6SHqRZI16q/IgLM91+SGMlFFaebiNGunyPFyVH8NyqMshmpQ20E6rJA94vMFLbic6qkTTB58JA6+Ak2k+SZPr00r5HEblhVY0zjt+m1DNsu+Jkjro9ySbjackjOMCk1ncTx+lZbG8yR6WkmtGa10evl6u3ZRLWJVL1FEuzeIvl3swWq/xt39BwddhRLV/3eD+BofhSllPhUYrN+CH7+OBlrNwhWg4XnE84ehxvMDrurQc33Psc/Q5nnLOMfo2xmrjWRV6WHHPazC2lYeBmSnHCWODeSiB2QcHFRtsvppJt5JjiUW3yLGYBTP6eclB/1b6t6jBNuqhybOOemp2YFczcnxhn1jedeizZurfCVNOIPkBsegBcgaNd53UQ4byhX1wIEz5NbPpZC4O83WN+dbsiGXulEPLWPf5wqRLvo/8QJiMPaiZapD8APkDYizmJS/pEUfHMeClHtA++sWd9qd21U/LiWhlXy7M4nd51IvUcJnfxpMELju+uUv2zrJ8FqcKh5paZOn1QlpDPvPgQmjz5Wyc5C0pzbLHdDpv503v5lmedDaRmGC4jvxxlt9s9f4Up2lLqM7wllQdNi2pyHGSNH7HeZ49tZRZXNy3hMap0+opmRftAoq4XWL8EG+NNtvMed1TPxTfkcUXw/7/YvyjLwYtQf+tufmtlcO7N8s7rQ+5w/1QO10u+o7Roe9YmgbcdTXUDmND3fY2pF17Q9xxOLRXTE69bvucqtq2Og2143Yaqmn4aNR7Bg==",
            answer: "m=edit&p=7VVNb5tAEL37V0R73oP3k4Rbmjq9pGlTp6oiZFnYIQkKNingpsLiv2dmWRvWbKSoatUeKsT4+e1jdpadx5bfN3GRUA2XOKZjyuDiWpubSWnusb2u0ypLwiN6uqke8gIApZ/Oz+ldnJXJKLKq2Whbn4T1Fa0/hBFhhBIONyMzWl+F2/pjWE9pPYUhQhlwF62IA5x08JsZR3TWkmwM+NJigDcAl2mxzJL5Rct8DqP6mhKc5515GiFZ5T8SYuvA/8t8tUiRWMQVLKZ8SJ/sSLm5zR83ZDdFQ+vT18sVXbliX67wl8v/fLkns6aB1/4FCp6HEdb+tYPHHZyGWyI4CRklMjA/SsFPg7VuITITb0w8N5GbeA2P01qY+N7EsYnKxAujmUBuxgRlXJCQw45z3sPQVpxbjBppMTQYVxYrwLrFTHcYeWE1ArHlBWhEYLHsaSC/sPkF1CB69Qhbg2AdloDlDoNGWawQ22el6DDml6LTaKvXiC2vQRP0npW2HjSUslgB1rLT655G2rVIWK/srXeHJeKg0yjV5dxj5K1egV5bjMYOdhhrsHoN+gBxgw2NW3pmojRRm60OsI+g0/qtoN0mOGimtlGmu8Yi2AURTOe4gWCfRGzASi+rvBkCn1Z4MwhvBuylIYudMcwgvXmlN6/yZsBu8mi9eZV3bdqbAXdzqA282kB6WX8G7dV63tn+e4FN1Iwi9N3+Ur+OZ6OITDfFXbxM4Bs4ub1Pji7zYhVnBI4cUubZvLSjoTmRqOHWm9UiKRwqy/OnLF27uvR+nReJdwjJBKbz6Bd5cXuQ/TnOMocozQnrUO3rcqiqSJ3/cVHkzw6ziqsHh+idCU6mZF25BVSxW2L8GB/MturW3IzIT2LuSMB5Lv6f53/pPMctGL/xVP9dJ/gbPv3/Vjmme/PCa32gPe4H1utyyw+MDvzA0jjh0NXAeowN7KG3gRraG8iBw4F7xeSY9dDnWNWh1XGqgdtxqr7ho9noBQ==",
        },
    ],
});
