import { range } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines over the dotted lines to divide the board into rectangles
    const grid = new ValueMap(puzzle.points, _ => cs.choice(puzzle.points));

    // Each rectangle contains exactly one black circle
    // A number indicates the size of the rectangle, in cells
    for (const [p, text] of puzzle.texts) {
        const area = parseInt(text);
        const choices = [];
        for (let h = 1; h <= area; h++) {
            if (area % h == 0) {
                const w = area / h;
                for (let row = p.y - h + 1; row <= p.y; row++) {
                    for (let col = p.x - w + 1; col <= p.x; col++) {
                        const points = range(row, row + h).flatMap(y => range(col, col + w).map(x => new Point(y, x)));
                        if (points.every(q => q.eq(p) || (puzzle.points.has(q) && !puzzle.texts.has(q)))) {
                            choices.push(And(...points.map(q => grid.get(q).is(p))));
                        }
                    }
                }
            }
        }
        cs.add(Or(...choices));
    }

    const model = await cs.solve(grid);

    // Fill in solved regions
    for (const [p, q] of puzzle.points.edges()) {
        if (model.get(grid.get(p)) !== model.get(grid.get(q))) {
            solution.borders.add([p, q]);
        }
    }
};

solverRegistry.push({
    name: "Shikaku",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wc025dV2zS5qtS6aqQihyEtqgQtwZWCdH+d/73oMIDEzaDtt6mByeXj5+tr8Gf118q4RKeADNm3CbO9Bcd0KPb+Pv1JZpmSXhGb+syp1UkHD+aTrlDyIrEitqqmLroC9Cfcv1xzBiLuP0OCzm+jY86JtQz7leQBfjPrAZZA7jLqTXbXpH/Zhd1dCxIZ83OaT3kG5StcmS1awmn8NILznDdd7TaExZLr8nrB5G/zcyX6cI1qKEzRS79LnpKaqtfKqaWic+cn1Zy12c5OIqjVyvlYtpLRezEbm4iz8s9yI+HuG1fwHBqzBC7V/bdNKmi/AAcR4emGvjUB+01N+GuR4C+FQn4FFFF7gIvA6gIZ05fBrSqfAnvTmCcwTBCYAYhyTdU5xSdCkuQTHXHsUPFG2KAcUZ1VxTvKN4RdGn+I5qznHPv/VW/oKcyK0Nhi34tSy2Ijav8nWizuZS5SJjYDFWyGxVVOpBbODAkAPhTADbU6WBMimfs3Rv1qWPe6mS0S6EyfZxrH4t1bY3+4vIMgPU94mB6qNvoFLBue78F0rJF4PkotwZoOMBY6ZkX5oCSmFKFE+it1re7vlosR+MnsiD+8v7f3/9o/sLP4H91vz61uTQ6ZVq1PqAR9wPdNTlDR8YHfjA0rjg0NVAR4wNtO9tQEN7Axw4HNhPTI6z9n2OqvpWx6UGbseluoaPYusV",
            answer: "m=edit&p=7VRdb5swFH3Pr6j87AdsQxN467pmL1m2LpmqCkURSWiDCqEzsE5E/PddX0PBwKTtYR8PE+HmcLg+PmCOsy9FIEPqwCFm1KIMDs5neNqW+jXHOsrj0LugV0V+TCUASj/M5/QhiLNw4tddm8m5dL3ylpbvPJ9wQvFkZEPLW+9cvvfKJS1XcItQG7gFIEYoB3jTwju8r9C1JpkFeFljgPcA95Hcx+F2oZmPnl+uKVHzvMHRCpIk/RoSPQyv92myixSxC3J4mOwYPdd3suKQPhWkmaKi5ZW2u2rsstauaO2KV7ti3C7//XbdTVXBa/8Ehreer7x/buGshSvvXClfZ8ItNdQGL3ptCBdEL1dDCKtPcEWIDiF6GrbV67BnPQ1nqginIcAMQ0v3WOdYOdY1OKalwPoWq4XVwbrAnhusd1ivsdpYL7Fnqp4Z3kpX49IcTVwOS8WIJyhxBUCOEP4BC007AO2aFh0MMWFW2860CnAtVv2skbQBi06PW2PQ4bUOAx3e6MBYXo9lLuCZxnzawaDDax0Ia4tBU9Sa3O1g0Be1vrA6WPWrufTH8boq+o2vOiukV0W98Wric71XqMP5ObSZ+GRZJLtQXixTmQQxgd2CZGm8zQr5EOzh28fNhCJ3wk6DitP0OY5OZl/0eEplOHpLkeHhcax/l8pDT/0liGODyHBrNCidYoPKZWRcB1KmLwaTBPnRIDpxNpTCU24ayAPTYvAU9GZL2meuJuQbwdMXsBWL/1vxX9qK1RJYv7Qh/5Gd8N+yg19vKkejD/RI+oEdTXnND4IO/CDSasJhqoEdCTaw/WwDNYw3kIOEA/eDkCvVfs6Vq37U1VSDtKupuoH3N5Pv",
        },
    ],
});
