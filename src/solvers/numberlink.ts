import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Implies }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw paths going through the cells
    const [network, grid] = cs.PathsGrid(puzzle.points);

    // The paths connect identical numbers
    const instanceGrid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Implies(grid.get(p).hasDirection(p.directionTo(q)), instanceGrid.get(p).eq(instanceGrid.get(q))));
    }
    for (const [p, text] of puzzle.texts) {
        cs.add(instanceGrid.get(p).eq(parseInt(text)));
    }
    for (const [p, arith] of grid) {
        cs.add(arith.isTerminal().eq(puzzle.texts.has(p)));
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
    name: "Numberlink",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wK1nCreuaXTK2LpmqCqHISWiDCnFnYJ0c5X/vew8yYmDSdtjWw+Tw9PLxM/4a++viayVUwkfQvAm3uQPNdSf0+Db+Tm2ZllkSXPDLqtxJBQnnH2czfi+yIrGipiq2Dnoa6Buu3wcRcxhnLjwOi7m+CQ76Q6BDrhfQxfgE2LwuciG9btNb6sfsqoaODXnY5JDeQbpJ1SZLVvOafAoiveQM53lLozFlufyWsEYH/t/IfJ0iWIsSFlPs0qemp6i28rFqap34yPVlLXdxkouzNHK9Vi6mtVzMBuTiKv6w3Gl8PMJn/wyCV0GE2r+06aRNF8EBYhgcmOvhUNgZp94b5vqnpTfAm3aAP+kM8anCb8HIRuCdgXEHjKnixxAQ45CkO4ozii7FJSjm2qP4jqJNcURxTjXXFG8pXlH0KY6p5g2u+be+yl+QE7m1wbCNfi2LrYiFVb5O1EUoVS4yBhZjhcxWRaXuxQYODDkQzgSwPVUaKJPyKUv3Zl36sJcqGexCmGwfhurXUm07b38WWWaA+j4xUH30DVQqONdn/4VS8tkguSh3BjjzgPGmZF+aAkphShSPojNb3q75aLHvjJ7Ig/vL+39//aP7C7fAfm1+fW1y6PRKNWh9wAPuBzro8ob3jA68Z2mcsO9qoAPGBtr1NqC+vQH2HA7sJybHt3Z9jqq6Vsepem7Hqc4NH8XWCw==",
            answer: "m=edit&p=7VRNb9pAEL37V0R7noN31+bDtzQNvVDaFKooshAy4AQrBqf+aCoj/ntnZg3GxpXaQz8O1eLR4+3M7tux32ZfiiANwcWhB2CDxKHUgB/Hpt9xzKI8Dr0ruC7yTZIiAPgwGsFjEGeh5VdZc2tfDr3yDsp3ni+kAKHwkWIO5Z23L9975QTKKU4JGCA3NkkK4W0N73me0I0hpY14UmGEDwhXUbqKw8XYMB89v5yBoH3ecDVBsU2+hqLSQf9XyXYZEbEMcjxMtoleqpmsWCfPhThucYDy2sidHuXKWq6u5eqTXN0tV/1+ucP54YBt/4SCF55P2j/XcFDDqbc/kK69UJpK8c1I826Eco5Hrwg9bBHOoFXicIZTE65NhD4jei2iZzdKUIxkSQ8cRxwVxxkqhlJzfMvR5uhyHHPOLcd7jjccHY49zunTmbEr52v0jtVC2aCk8DQwGhpEH75BCqhDhBzQFRqiPxhpG7Q8IVOrJWhTq9WxAu3k9BmRj+QJmQpHgmMqHAVuNdsHx+zh2uCaPFcCtY1QD1yzntsHt8obmLxTOyYcTVtNy6ZnLTZtpZYdLF8Zs9Nwfw7NLV9Miu0yTK8mSboNYoF2F1kSL7IifQxW+PHybQDM7TizQcVJ8hJHu2Ze9LRL0rBzishw/dSVv0zSdWv11yCOG0TGd1uDMjZsUHkaNf4HaZq8NphtkG8axJkfGyuFu7wpIA+aEoPnoLXbtj7zwRLfBD++xrtU/79L/9JdSq/A/qUb9Y9cZf+WHP56k7TT+kh3uB/ZTpdX/IXRkb+wNG146WpkO4yNbNvbSF3aG8kLhyP3A5PTqm2fk6q21WmrC7fTVueG9+fWdw==",
        },
    ],
});
