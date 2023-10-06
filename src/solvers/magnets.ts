import { Constraints, Context, Point, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place several magnets into the grid.
    const grid = new ValueMap(puzzle.points, _ => cs.int(-1, 1));

    // A magnet consists of a 1x2 domino and has a positive and negative pole
    // An outlined region contains one whole magnet, or stays empty
    for (const [p, q] of puzzle.regions()) {
        cs.add(grid.get(p).add(grid.get(q)).eq(0));
    }

    // Equal poles cannot be adjacent
    for (const [p, q] of puzzle.points.edges()) {
        for (const i of [-1, 1]) {
            cs.add(Or(grid.get(p).neq(i), grid.get(q).neq(i)));
        }
    }

    // The numbers around the grid indicate the number of positive/negative poles in that row/column
    const plusSign = [...puzzle.symbols.keys()].find(p => puzzle.symbols.get(p).eq(Symbol.PLUS_SIGN));
    const isPlusSign = (p: Point) =>
        puzzle.lattice.edgeSharingDirections().some(v => v.crossProduct(p.directionTo(plusSign)) === 0);
    for (const [p, v] of puzzle.entrancePoints()) {
        for (const q of [p, p.translate(v.negate())]) {
            if (puzzle.texts.has(q)) {
                const value = isPlusSign(q) ? 1 : -1;
                const number = parseInt(puzzle.texts.get(q));
                cs.add(Sum(...puzzle.points.sightLine(p.translate(v), v).map(p => grid.get(p).eq(value))).eq(number));
            }
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved magnets
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value) {
            solution.symbols.set(p, value === 1 ? Symbol.PLUS_SIGN : Symbol.MINUS_SIGN);
        }
    }
};

solverRegistry.push({
    name: "Magnets",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVNb9s4EL37VwQ88yCSsi3plqZJL6nb1CmCQDAC2VFiI7KVyvZmIcP/PW+GdPRhFYsssEUOC0H00+Mb6g2pGa9/bZMilYEcShNITypcxtfSeL70B4pvz13Xi02WRifydLuZ5wWAlN8uLuRDkq3TXqyhwD3p7cowKq9k+SWKhRJSaNxKTGR5Fe3Kr1E5kuUYU0IqcJdWpAHPK3jD84TOLKk84JHDgLeAy2Qzt0/fo7i8loLe8YkjCYpl/lcqnAd6nuXL6YKIabJBIuv54tnNrLf3+dPWadVkL8tTa3XcYdVUVglaq4Q6rFIGZHW2KGZZenf5H9gNJ/s9tvwHDN9FMXn/WcGgguNoh3EU7YQOKRSnouy5CKNahH9EmMPmHAi/TfSJMBUx4JDaGkNW1ELCoKUI2djbGrCr2PQtmR5gTmOXDocuDKlNxUB4wXLN4zXSlqXh8TOPHo99Hi9Zc46FVWCkCpAOFldDwvBJOPBruC9VOLQ4HNQw8XAGrFUotfYs1igFjU0k7BFvMeIknt/W0R62gDVBLVZJbbB5h1jleIU1lVtTQaO0wxrY6UmjHa/BG5sX67XTaAPe5sWx2mm0D97mwvkGB4x8g0O+Q+RrPeMX2OUyJL3TBKQ55Ej+Xe7EBy42QGzgNMDaczl6lCP5x+Hc8BGd8ejzOOCjG9L3/K4vvv4h/buv5B/txH3NrdNeyPQ9eNKLxfn9Y3oyyotlkqHKR9vlNC2q5/E8eU4FWqtY59ndels8JDM0C+686AfgVhzRoLI8f84Wq6Zu8bjKi7RzisgUNjr007y4b63+kmRZg7D/JA3Ktr0GtSnQ02rPSVHkLw2G67lO1PpfY6V0tWka2CRNi8lT0nrbssp53xN/C77RRDw08P//t/78/xZtv/fRavmj2eEvNy86yx50R+WD7axwxx8VOfijcqYXHlc02I6iBtuua1DHpQ3yqLrB/abAadV2jZOrdpnTq44qnV5VL/Z40nsF",
            answer: "m=edit&p=7VVdb9MwFH3vr5j87Ad/5MPO2xgbL6MwOoSmqKrSLlurpc1IW4ZS9b9z7bhxYgeJIYF4QFGsk5Nzr49j39zt131W5VjgGHOBCaZw8YBhTgIcRFTfxFy3q12RJ2f4fL9blhUAjD9cXeGHrNjmo5SBAu7p6FDLpL7B9bskRRRhxOCmaIrrm+RQv0/qMa4n8AphCtx1I2IALy38ot8rdNGQlAAeGwzwDuA62y2bp49JWt9ipOZ4oyMVROvyW46MB/W8KNfzlSLm2Q4Wsl2uns2b7f6+fNqjU/ojrs8bq5MBq9xa5a1VPmyVGauLVbUo8tn1H7Arp8cjfPJPYHiWpMr7ZwuFhZPkcFS+DohJFQq7Qpt9QZw6ROAR/PRxTkTgEqEiuCUi7uSIQydECkchZS8H2KXa9J0yHcE7hu2mI67U3DIgvNJypsdbWDauuR7f6pHoMdTjtdZcQmIqOKYClgPJaaxw2GARdHCIqYwbLKMOVnykMaMSM0YazKAUGG0wkS2GOAzPbR5GhNGITizFjHMbSw1PISc1OSloKDOYAeZWwwzPgOeB1TOjYRz40MYyo2EB8JFdrzhhWK+IW/9UCoMFYLOWOLQaEVteytaz5oWJFRArZIsZMWskxKzrqApLbdGFHgM9RnrrYnWe4cR3tzbqb2pz0Nvz02z8pD1LIXPPUsj7ZwkY77yFsauJIo+J3ahIeBrpamIvShCPoW4eIV1GelHSi5Lc1VD18fsiSqivYr5qIFfoFWVTiGo3j6M0ZLrDNFf8Ojwdpejy/jE/G5fVOivgZzjer+d5ZZ8ny+w5R9CB0LYsZtt99ZAt4J+qGxTW3EZH9KiiLJ+L1aavWz1uyioffKXIHGwM6Odlde9kf8mKokdsdcPtUU136FG7atV7zqqqfOkx+gt3iU6b6GXKN7u+gV3Wt5g9Zc5sa7vm4wh9R/qGbSXQ5/6397/f3tXnJ69q8t3e+XuN8Rf+wP+WHX1yy2qw7IEeqHxgByvc8F6RA++Vs5rQr2hgB4oaWLeugfJLG0ivuoH7SYGrrG6NK1dumaupvEpXU3WLPZ2OfgA=",
        },
    ],
});
