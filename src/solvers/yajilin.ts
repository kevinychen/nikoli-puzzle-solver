import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Iff, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board, and draw a single loop that goes through all remaining cells
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);
    const shadedGrid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    for (const [p, arith] of grid) {
        cs.add(Implies(shadedGrid.get(p).eq(1), arith.eq(0)));
    }

    // Cells with numbers cannot be shaded, and are not part of the loop
    for (const [p, arith] of grid) {
        cs.add(Iff(puzzle.shaded.has(p) || puzzle.texts.has(p), And(shadedGrid.get(p).eq(0), arith.eq(0))));
    }

    // Shaded cells cannot be orthogonally adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(shadedGrid.get(p).eq(0), shadedGrid.get(q).eq(0)));
    }

    // A number indicates the amount of shaded cells in the given direction
    for (const [p, text] of puzzle.texts) {
        const [v] = puzzle.symbols.get(p).getArrows();
        const number = parseInt(text);
        cs.add(Sum(...puzzle.points.lineFrom(p, puzzle.lattice.bearing(p, v)).map(p => shadedGrid.get(p))).eq(number));
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        if (model.get(shadedGrid.get(p))) {
            solution.shaded.add(p);
        } else {
            for (const v of network.directionSets(p)[model.get(arith)]) {
                solution.lines.set([p, p.translate(v)], true);
            }
        }
    }
};

solverRegistry.push({
    name: "Yajilin",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRRb5swEH7Pr6j87IcACWl5a7tkL126jkxVhVDkJG6DCnFnYJ2I8t97d3ZGCFRb+7DtYbJwPj4fvi8+f5d/K4WW3IfhnfI+d2C4vk+PMxjQ07djlhSpDE74eVmslQbA+fVkwu9FmsteZKPi3rY6C6obXn0MIuYwzlx4HBbz6ibYVp+CasyrEJYY94C7MkEuwHENb2kd0aUhnT7gqcUA7wAKrdXz/F6VWq4e5PzCfPA5iKoZZ5jvgnZByDL1XTKrB9+XKlskSNAmoWXzcqUeSxvnxDtenRvJ4V4y5raSUb2VjNBIRtQhGYWh5GWil6mcX5mN3ih1IQo4/3ydPHXJPYt3Ozj6LyB4HkSo/WsNT2sYBlvmuSzwOBuO6Gc0gB9YmdoVo97UjBYjLKEhIMwJtjDf7YP3dafhQP15d2HMTgfREPtqNCSYUBqX5hlI55VH8wea+zQPab6imDEIcly4vi6ockGs63IHFSL2gN9j3+POyKuxD7oIw2VHjYgHePnhdPZ46Bs8RIw8JLyltJc0D2j2Sc4Iz/k3K2FO/fBQ3/fPfyknwtP4OYbvx3EvYmGp78VSwi0cQ8VOpkpnIoW3aZktpK7fw7V4kgwaAstVOs/tVwH1C7i9wG3oiwaVKvWUJptmXPKwUVp2LiGJF6cjfqH06mj3Z5GmDcL0vwZlTNqgCg0OPHinO9tgMlGsG8SBWxs7yU3RFFCIpkTxKI6yZfV/3vXYD0ZP5IF/vP/d9i92WyxD/y09t7r+Y4b/x/qPaQFKd3YBoDsaAbCdhrd8y/PAt9yNCdsGB7bD48Ae2xyottOBbJkduFf8jrseWx5VHbseU7WMj6kOvR/FvRc=",
            answer: "m=edit&p=7VVdT9swFH3vr0B+vg+NHduQN2BlLwzGyjRNUVWlJdCItGH52KZU+e+79nUa0gYJeNhepijOyfH19YnvR4ofVZTHoPASxzAGDy+ulL0937f32F23SZnGwRGcVuUqyxEAXF9cwH2UFvEodFaz0bY+CeobqD8GIfMYMI63x2ZQ3wTb+lNQT6Ce4hQDgdwlGXGEkw5+s/MGnRPpjRFfOYzwO8Ioz7Nf8/usyuO7h3h+Rgs+B2F9C8zsd2a9GMjW2c+YOT3mfZmtFwlrnUwdW1R32WPF2m0aqE9J8rSV7HWSRSdZ7CSLYcncSV4m+TKN55fk6I1SF1GJ51+skqchuSezpsGj/4KC50FotH/t4HEHp8GWCc4CAUxq+9A+PhqjlWZIPcXMToYmhESgmRdsG/M1zriNu708jD8MB4Y8hT3bF61xgwu7DbfjLUqHWtjxgx3HdpR2vLQ2ExTkcUxfjqo4iuUcPOGw8DqsBHhadFj5DmOya4d9k/y6w1IRlgYbvjEBN9ue29G3o7JytDlnjMRzuaoVyrgA7ttjRyQEIR+4JCRBOIQlqFskFCENgjghwKe1QrazQoNPsz5vZxFJijWWsS9bJEmBL0E6Tu3WKpDkT3JQLk9EuwKRIs9SgqK1eCaKVigOmlbguWqyUxI02WFDUbSH0qBd6vHWTqMdedGKZimmlJe7tKO4mxw2YcacFL59mCB6lJa7fDEBakahyYPdJd+PZ6OQTav8PlrGWH8TzNWjqyxfRym+XVXrRZx379NV9BQzbIWsyNJ54VYFtlOC5TZ2RY9Ks+wpTTZ9u+Rhk+Xx4JQhTckM2C+y/G7P+68oTXtEYTt/j6L21KPKPOm922rtMeuoXPWIZ32q5ynelH0BZdSXGD1Ge7utu29uRuw3s3cosHOI//+Zf/ifMWEYv+VvU1/vFTIV6jua/Cs672tU/T05NpGzfLALID3QCJAdLHjHH9Q88gfVbTY8LHBkB2oc2f0yR+qw0pE8KHbkXqh343W/5I2q/ao3Wx0Uvtnqee2Hs9Ef",
        },
    ],
});
