import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a symbol in every cell
    const points = [...puzzle.points].filter(p => !puzzle.shaded.has(p));
    const grid = new ValueMap(points, _ => cs.int(0, 1));

    // Some symbols are given
    const symbols = [...new ValueSet([...puzzle.symbols.values()])];
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(grid.get(p).eq(symbols.findIndex(s => s.eq(symbol))));
    }

    // There may not be a straight run of 3 or more consecutive shaded or unshaded cells
    const numForbidden = parseInt(puzzle.parameters["forbidden"]);
    for (const [p, arith] of grid) {
        for (const v of puzzle.lattice.vertexSharingDirections(p)) {
            cs.add(Or(...range(numForbidden).map(i => arith.neq(grid.get(p.translate(v.scale(i))) || -1))));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved symbols
    for (const [p, arith] of grid) {
        if (!puzzle.symbols.has(p)) {
            solution.symbols.set(p, symbols[model.get(arith)].toGreen());
        }
    }
};

solverRegistry.push({
    name: "Marupeke",
    keywords: ["No Four in a Row"],
    parameters: "forbidden: 3",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTLbts6EN37KwquudDL1mOXpPHduLlNnSIwBMGgbSYWIpuuHk0gw/+emaECmZIKdNGgWRS0hjOHo5kjmofFj0rkkvsw3IBb3IbhWh49Ewt/b+MuLTMZfeIXVblVOTic/z+d8geRFXIUN1nJ6FiHUX3L6/+imNmMMwcemyW8vo2O9ZeoXvB6DkuM24DNdJID7nXr3tM6elcatC3wbxof3AW46mV5qaOvUVzfcYY9LulNdNlO/ZSs4YDxWu1WKQIrUcKHFNv00KwU1UY9VU2unZx4faGpzgeoui1VdDVV9Aao4hcg1XWarzO5nL0D3TA5nWDLvwHhZRQj9++tG7TuPDoyJ2CRzZk71pOOPEtPPk0TlyZfg76jp5CmQEeBfj3ECArfREewNtkFNoHl2OPt38OcSRdxoXwMNc4QaGEiYyBkIr7XRQKsY1QO7G5O2MsJOwyB+JToO2TvYMN47ZL9TNYiOyY7o5xrsvdkr8h6ZCeU4+OW/+af0t/Bd6ITOx5p+22M/3yUjGI2r/IHsZZwVOdbcZAM7gNWqGxZNHhE1wUcYsD21W4lcwPKlDpk6d7MSx/3KpeDSwjKzeNQ/krlm071Z5FlBqAvPwPSWjWgMgchnsUiz9WzgexEuTWAM9EaleS+NAmUwqQonkSn26795tOIvTB6YhcuW/ffZfsXLlvcfuujqfuj0aGTq/JB2QM8oHxABxXe4D2RA96TMzbsKxrQAVED2tU1QH1pA9hTN2C/EDhW7WocWXVljq16SsdW52KPk9Er",
            answer: "m=edit&p=7ZXfb5swEMff81dMfvYDYH6Zt7ZL99L96JKpilAUkYQ2qCRkQNaKKP/7zmdago9Je1i1PUwk5/PH9vlrw9nV90NSpjyAR4Tc4jY8wnLx71vq9/JMszpPo3f84lBvihIczj9fX/P7JK/SUdz2mo+OjYyaW958iGJmM84c+Ntszpvb6Nh8jJoZbybQxLgN7EZ3csAdd+4dtivvSkPbAv9T64M7A7d4Xlzq2pcobqacqTkucaRy2bb4kbJWg6qviu0yU2CZ1LCQapPt25bqsC4eD+wl/Ik3F1rqZECq6KSKV6liWKrTSl1l5SpPFzdvIFfOTyfY8q8geBHFSvu3zg07dxIdmROyyOZMeLrQNdfSRYCFL7AINAwcXUgsQl0L9XCpaie11CNYG+1MTQLNscu718Mc3yQCwsd2j0iTeIFJAtckoWVGDm2zjyR9pKEQhF+jfAftFDaMNwLte7QWWg/tDfYZo71De4XWRetjn0BtObyU8xg+GX2+cXqGSbeJ3VLH7SYGhMjXZbRE+IQEJnFtQnwzshsSIk3iWWYcj0T2HDKKRPbIKnwS2bfNUT6J7IdkFIkcEIWBMEkozMgheReS6JFklHTNyNLY59dPTX1Gp1HsuHj2vjzen6/NRzGbHMr7ZJXCUTLZJPuUwXnNqiJfVC2P8DjnyHaH7TIteygvin2e7fr9soddUaaDTQqm64eh/suiXBvRn5I874EKL6ce0mdpD9Vl1qsnZVk89cg2qTc9cHao9iKlu7ovoE76EpPHxJht2635NGLPDP+xgMtQ/L8M/8JlqLbf+s0rkd5fb3YZ/Fty8MstysG0BzyQ+UAHM7zlJMmBk3RWE9KMBjqQ1EDNvAZEUxsgyW5gv0hwFdXMcaXKTHM1Fcl0NdV5ssfz0U8=",
        },
    ],
});
