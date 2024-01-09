import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a loop that goes through every unshaded cell
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // The loop cannot go through shaded cells
    for (const [p, arith] of grid) {
        cs.add(arith.eq(0).eq(puzzle.shaded.has(p)));
    }

    // The loop visits each outlined region the given number of times
    const regions = puzzle.regions();
    const numVisits = parseInt(puzzle.parameters["visits"]);
    for (const region of regions) {
        cs.add(
            Sum(
                ...region.flatMap(p =>
                    puzzle.points
                        .edgeSharingNeighbors(p)
                        .filter(([q]) => puzzle.borders.has([p, q]))
                        .map(([_, v]) => grid.get(p).hasDirection(v))
                )
            ).eq(2 * numVisits)
        );
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
    name: "Double Back (EntryExit)",
    parameters: "visits: 2",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZVNT+NIEIbv+RWoz31w+/PjxjJhLiwzbFghZEXICQYinJhxkmHlKP+dt8pl2U48mjmwGg4jJ+Unr6urqjtd7fW3bVpmOsDlhNrSBpdjufz1Lfo01/Vik2fxiT7dbp6KEqD1l/Nz/ZDm62yUiNd0tKuiuLrS1ec4UUZpZeNr1FRXV/Gu+juuxrqa4JHSBtpF7WQDxy3e8HOis1o0FvhSGHgLnC/KeZ7dXdTK1ziprrWiPH/xaEK1LL5nSuqg3/NiOVuQMEs3mMz6afEiT9bb++J5K75mutfVaV3uZKBcpy2XsC6XaKBcmsX/XG403e+x7P+g4Ls4odr/bTFscRLvlOOr2GjlWvUt4ltg8y00uMHvMt7BGra3bM/Z2myvEUxXDttPbC22HtsL9hkjk3ECbdxQxTb+f7fLPjgQ9sAoqWFP2Osw+Xvi73UZMX2J6YfaBJgMcXDAoXAYadvCvImjDkM3UaNb0LEMYNzBWBlmG+wIO9o2rsTH2LCJg+aJ6rEUp+U2DvvQMjOj1SLRozY+sYkadsCSK3Lh40kNHljWJ4RPKD4hxoYylriJQ7lCyeWh5kBqDjr1kO6LjrY3gehBdyzW3JM197C2vqyt34lJuie622EcL4Y2HOudXMReMxZ5fclLNTRMNdAuZca8ApoXNtoNb7czti5bn7dhQDv+F3vivXb8T8tJbJeP1+bCHn/vX9NRoibb8iGdZzgpxveP2cllUS7TXOFgVusiv1vL05jPbZwk0Fbb5Swre1JeFC/5YtX3WzyuijIbfERihnQD/rOivD+I/prmeU+o30I9qT4we9KmxGnY+Z2WZfHaU5bp5qkndE7OXqRstekXsEn7JabP6UG2ZTvn/Uj9p/ibOHjrOX/eer/prUd/gfXR+vyjlcO7tygHWx/yQPdDHexy0Y8aHfpRS1PC466GOtDYUA97G9Jxe0M86nBoP2hyinrY51TVYatTqqNup1Tdhk+mozc=",
            answer: "m=edit&p=7ZZNb9tGEIbv+hXBnufA5XK/eEtTuxc3bSoXRSAIBm0zsRDJTCmpKWjov/fdnaVISiqQQ4r2UEhaPnq588HhzpLb3/dVW5PFRznKSOKjsiL+TBa+/ed2tVvX5St6vd89NS2A6Kfra/pQrbf1bJFmLWcvnS+7d9T9UC6EFCRy/KRYUveufOl+LLsr6uY4JUhCu+FJOfBqwN/i+UBvWJQZ+G1i4Hvgw6p9WNd3N6z8XC66WxIhznfROqDYNH/UIuUR/j80m/tVEO6rHS5m+7T6nM5s94/Np73oQxyoe83pzi+kq4Z01TFddTnd/J9P1y8PB5T9FyR8Vy5C7r8O6Aacly9CGVFKEkXGBx8PNo8HJ3E4hMxfMMo4vo/jdRzzON7CGXUqjt/HMYujjuNNnHOFSFJZkoUTZY77X4zZgG1iDTYD68R6xGG+TvP1mOHTJJ/GkbSe2Z6wS+w85VnG7EcMXfpez6DLyDiC88Q5WCVWlMsi+Yet6/2gebw8+hl48BPnuKQ7tJpPuh/8B5a+ZwVOsXyBOTrloMGpPg5zXJrjYOvUwL2fEMulWBo525SzHeUTdJN0tL20SbdjW9Rcp5pr1Nak2pqRz6DrpBcjxvYii14fxQqse1vENXLIwYxysCkHi+uy4boOofXCcnsTxyKOJi5DG1Y8emK8TE2/QEWOSqKQigKpRKioYTKkLJOl3PWkEjnKPZPHJhlJZVRIJk0Fe8HqL9gC163YQnnSbFFI0jmToYKjoUc0W6Bqmi1QD82etSTDFjono5iOFiCTyJPlGGH3lj3ZREcvRpEtmBwZjoa76NjWHi3scR7IJRrmefJMWG1O9eQTKfJs4QpyXGenyXOF0COeY6BDPGflj7ZY7Z4tfLLgfeVkf+K9Zz7aq3h/CgvjMFvg/srRR3/7f8vZQsz37YfqocbefPX4sX71tmk31VrgUSi2zfpum86W8UlJUXveb+7rdiKtm+bzevU8nbf6+Ny09cVTQawR7sL8+6Z9PPH+pVqvJ8I2PvcnEj+iJtKuXU3+V23bfJkom2r3NBFGz6qJp/p5N01gV01TrD5VJ9E2wzUfZuJPEX8LhfcM9f97xr/0nhFuQfaVbxvf6l3iKzb6/1Y6cfU27cXWh3yh+6Fe7PKknzU69LOWDgHPuxrqhcaGetrbkM7bG+JZh0P7myYPXk/7PGR12uoh1Fm3h1Djhl8sZ38B",
        },
    ],
});
