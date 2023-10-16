import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Distinct, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines to move some of the letters
    // Lines can not go through the start- or endpoint of other letters
    const [network, grid, order] = cs.PathsGrid(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.neq(0), Or(arith.isLoopSegment(), order.get(p).eq(0)).neq(puzzle.texts.has(p))));
    }

    // Create grid where every cell on a path has the value of the starting letter
    const letters = [...new Set(puzzle.texts.values())];
    const whichLetter = new ValueMap(puzzle.points, _ => cs.choice(letters));
    for (const [p, text] of puzzle.texts) {
        cs.add(whichLetter.get(p).is(text));
    }
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Implies(grid.get(p).hasDirection(v), whichLetter.get(p).eq(whichLetter.get(q))));
    }

    // Different letters must be in different regions
    const regionLetters = new Map(puzzle.regions().map(region => [region, cs.int()]));
    for (const [region, regionLetter] of regionLetters) {
        for (const p of region) {
            cs.add(
                Implies(
                    puzzle.texts.has(p) ? grid.get(p).eq(0) : grid.get(p).isTerminal(),
                    whichLetter.get(p).eq(regionLetter)
                )
            );
        }
    }

    // All identical letters must be inside the same outlined region
    cs.add(Distinct(...regionLetters.values()));

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Return Home (Kaero)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTBbptAEL37K6I974EFnNrcnMTpJXWbJlUUIRRhhyQo4E0X3FRY/ve8GYjMAlVbVVVzqDCj58cw83aWt8XXTWwSOcblTaQjFS7XnfDtO/R7vS7TMkuCAznblA/aAEj58fRU3sVZkYzCJisabatpUJ3L6n0QCiWkcHErEcnqPNhWH4JqLqsLPBJSgTurk1zA+R5e8XNCxzWpHOBFgwGvAVepWWXJzVnNfArC6lIK6nPEbxMUuf6WiEYH/V/pfJkSsYxLLKZ4SJ+aJ8XmVj9umlwV7WQ1q+VeDMj19nIJ1nIJDcilVfxludNot8PYP0PwTRCS9i97ONnDi2CLuAi2wnXo1Rm01HsjXEXEUYtwiThuEX6H8LjGSYvovuJ3u/iTTpdxt8aYdbSJQ6so9CtexTXHU44ux0ssUlYexxOODscxxzPOmWPtUx/744nARUHHtbFCe8IKLqAZMZ628AQ50xq78AqNjTHyaR6EPfBew3vgaQpc30MvDJExNKimrwJP0+Y60MDvQusVKz7m6HM85JW8o838re3+86H9VE5I02iu8a+haBSK+e19crDQJo8zfNiLTb5MzOt/nCSi0NlNsTF38Qq+4IMGnz64NWdaVKb1U5au7bz0fq1NMviIyATtB/KX2tx2qj/HWWYR9bFpUbXDLao0sG/rf2yMfraYPC4fLKJldatSsi5tAWVsS4wf4063fL/m3Uh8F3yHHo5p7/8x/Y+OadoC5625963J4a9Xm0Hrgx5wP9hBlzd8z+jge5amhn1Xgx0wNtiut0H17Q2y53BwPzA5Ve36nFR1rU6tem6nVm3Dh9HoBQ==",
            answer: "m=edit&p=7VTBbptAEL37K6I9z4HdZR3DzUnsXlK3qVNVEbIibJMYBZsUcFNh8e+d2cUxC1RKVVXtocJePR6zM28Z3uRf92EWgcJLjsABjpcQI/13Hfodr9u4SCL/DMb7YpNmCAA+TKfwECZ5NAjqqMXgUHp+eQPlOz9gnAET+OdsAeWNfyjf++UEyjk+YsCRuzZBAuHkBL/o54QuDckdxLMaI7xDuIqzVRLdXxvmox+Ut8CozoXeTZBt028Rq3XQ/SrdLmMilmGBh8k38XP9JN+v06c9O5aooBwbufMeufIkV77Klf1yxZ+X6y2qCl/7JxR87wek/fMJjk5w7h8q0nVgwqGtY9RiesMEJ+KiQQgiLhuE2yKkznHVINpb3HYVd9Sqoto5FG8TQysp6uf6FHd6nepV6PUWDwml1OuVXh29Kr1e65gJnt1zsT+S+QITOsLGnBvM0QX0jjT2GniEMZ7BAr0i6niB8bKOkcjLmpfIuzXvSKzl1hg18LouR57ets4j6r0VfVWk+FKvrl6H+iTn1Exsd/Okw+MZsbMgUKCkDoKQBnlobY1QG6UnJECap+h699wgD1wTR8Y3WVwOrjBIgDJ71RCU2aHOQZkdagTK7FAeDPHI0rxu88G9ts20ZN5ooWkbHbYaBMLMH7rU29BiELDJ+jE6m6XZNkzQHrP9dhllx3ucRyxPk/t8nz2EK3SXHleguZ2OtKgkTZ+TeGfHxY+7NIt6HxEZYfme+GWarVvZX8IksYhcD1+LMnPCooostu7DLEtfLGYbFhuLaAwMK1O0K2wBRWhLDJ/CVrXt6czVgH1n+h9IHPby/7D/S8OeWuD80sj//cH5hpH0b8nRX2+a9Vof6R73I9vr8prvGB35jqWpYNfVyPYYG9m2t5Hq2hvJjsOR+4nJKWvb56SqbXUq1XE7lWoaPlgMfgA=",
        },
    ],
});
