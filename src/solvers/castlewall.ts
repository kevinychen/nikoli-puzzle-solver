import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ Iff, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through orthogonally adjacent cells to form a loop
    const [network, grid] = cs.SingleLoopGrid(puzzle.points);

    // Lines cannot go through bold borders
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Not(grid.get(p).hasDirection(p.directionTo(q))));
        }
    }

    // Determine which cells are inside and outside the loop
    const isInsideGrid = new ValueMap(puzzle.points.vertexSet(), _ => cs.int(0, 1));
    cs.add(isInsideGrid.get([...isInsideGrid.keys()].sort()[0]).eq(0));
    for (const [p, arith] of grid) {
        const neighbors = puzzle.lattice.edgeSharingNeighbors(p);
        const vertices = puzzle.lattice.vertices(p);
        for (const [i, [_, v]] of neighbors.entries()) {
            cs.add(
                Iff(
                    arith.hasDirection(v),
                    isInsideGrid
                        .get(vertices[i])
                        .neq(isInsideGrid.get(vertices[(i + vertices.length - 1) % vertices.length]))
                )
            );
        }
    }

    const mainRegion = new ValueSet(
        puzzle.regions().find(region => region.every(p => !puzzle.shaded.has(p) && !puzzle.texts.has(p)))
    );
    for (const [p] of grid) {
        if (puzzle.shaded.has(p)) {
            if ([1, 4].includes(puzzle.shaded.get(p))) {
                // Black cells must be outside the loop
                cs.add(...puzzle.lattice.vertices(p).map(q => isInsideGrid.get(q).eq(0)));
            }
        } else if (!mainRegion.has(p)) {
            // White cells must be inside the loop
            cs.add(...puzzle.lattice.vertices(p).map(q => isInsideGrid.get(q).eq(1)));
        }
    }

    // A number with an arrow indicates the number of line segments in that direction
    // Vertical arrows only count vertical lines, and horizontal arrows count horizontal lines
    for (const [p] of grid) {
        if (puzzle.texts.has(p) && puzzle.symbols.has(p)) {
            const number = parseInt(puzzle.texts.get(p));
            const [v] = puzzle.symbols.get(p).getArrows();
            cs.add(Sum(...puzzle.points.sightLine(p, v).map(p => grid.get(p).hasDirection(v))).eq(number));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.directionSets[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Castle Wall",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZNb+M2EL3nVyx4agEeRH3Esm6726SXNO02KRaBYBhyoiTGylEq292Fgvz3fTMkrQ9SqLsFWhQoBFHDx5nhcEhx3vb3fdGUMsUTJzKQCk8cJPyGwZzfwDzX611VZm/k2/3usW4gSPnz+bm8L6pteZIbrcXJSzvP2g+y/THLhRJShHiVWMj2Q/bS/pS1N7K9wpCQKbALrRRCPOvEjzxO0nsNqgDypZEh3kAsmqb+vLyv901591Au32mDX7K8vZaC5nvHXkgUm/qPUph4qH9bb1ZrAlbFDovaPq6fzch2f1d/2htdtXiV7VsO25jY2CkIE3vUxU6ijp0kT+wUIcV+u25uq3J58U0xV+un8osv3Pni9RXp/xUBL7OcYv+tE9NOvMpeRDgXWSxFlPInjkSWSpHMuHd6yr0Zevik6AGcK+6pIDDfhGGlYnzh9NI4zWnDaYDCI7+5iJAEAyQhAUEPwCQcvDWhyXXeDEBhDAAKiJ1aEwptoMFBDhEKs2eEgFX2gvbGho0DrA5HnQ6y9J8wvaajtXnB/HP09Ke1aa32V7I2k9qcqp42609qcx6P9s1JPto378DR2np7jg5F792ROcSWnvPGhtxe48TLNuL2B24DbhNuL1jnDEdAzWKpaM0h5ktPISNbJM+SngydGY4960RSzY08h87c2kLnIEMnReysM6O7lGW+VxVSwHjak2ewxQ/JOsBDjeMLGRm2tgcZOtZnGMow0nPhC1nHFoZRJ0dKhnR6SY6Bx1YftgcZOhHOrPUZkj6S9JFT9Z7bmNtTTuGMrpQjLx19S/R/vW/brT8NJw+xg4MHO/RP9hcnubjaN/fFbYmL+gyn881l3WyKCr3L/WZVNl3/6rF4LgXqptjW1XJrrDIuq7jggT2xxQCq6vqZ6oDIds3eYOuHp7opu5GROv0jA1Drr+rmbuT8c1FVA0CzhAGkK9gA2jUoT70+/54DZFPsHgdAr/wOPJVPu2EAu2IYYvGpGM226db8eiK+CH71HfM/J/mXOQlthforzEQ0D6viO1Mcvodf4ikOSHeZBlWCq9a+NESF1NGnejmhT8VxYoiqguOKCt6EPle3yTFcxY4zLnAj1L0re4kJE7Bz844y0XNL1MMFDwt1nHTp6el3iemBXUocJ11i+gvsUuJf9sjN3y3i7lS2pLsjtsB7Rky593gzxd8dsVTAY2OIgd8b0QSPN0ManJEDhfDYGELh9cb0wuPNkA13xFIPfwQTI4aWeLwZkuKOWMrisTEExmNj6Iw7YsmNx8ZQHb83Ij7+qIkGuX/of4oUaX5RN16KAdjDMoB66YTBHUYB3OEONKFLH4B6GATQMYkA5PIIgA6VADbBJsjrmFBQVGNOQVM5tIKm6jOLfHHyFQ==",
            answer: "m=edit&p=7VZbb9s2FH73ryj4tAF8EEmJpPTWdslesmydMwyBYARyoiRG7SiT7bVQ4P/ew0PSulGr0wLDHgZB0qfvXHh4Eflt/9oXdUk1XHFCI8rgiqMEbx6leEfuulrt1mX2hr7d7x6rGgClv56f0/tivS1nufNazF6aNGs+0ObnLCeMUMLhZmRBmw/ZS/NL1lzTZg4mQjVwF9aJAzxr4Z9oN+i9JVkE+NJhgNcAi7quPt3cV/u6vHsob97ZgN+yvLmixLT3DrMYSDbV3yVx9Zjv22qzXBliWeygU9vH1bOzbPd31cc98U0daPMWy3YhvnbW1i7a2sWxdhGunbvab1f17bq8ufimmterp/JzqNx0cTjA8P8OBd9kuan9jxbqFs6zF8JTksWUCI2vWJBMU5Io/JISv5TCl5ZIpgy/WBS5d4I0YzG8D6aHNmluJjy2U455cyJgEByRcENEHUK54n2IadyOmyOUGhBauqQ+xJTW88Ai+4wpsxMEBbPs5WBmw5Wdm8UftRcEBVeY7dPJ3thh/DnYKd7Ke9uL/aM3DlXHG/0nvdWrcutX5cYZONnbTs/Jpdi5O3EMYUrPcWI5Pq9gxdNG4PMnfEb4TPB5gT5nsASYiikzfebQnpaAlcUq6WDwUYnzEZSlDqfgk/rYuIPBR8fOR5m9FDHuqyxyvO5gBbHa+QDPLQ9vwKyNPWLd5uSccmHbgjfgxPGixYJRblavwTHwsffnHQw+grc5ufE/mG3NDNV7fMb4lDiEymwpsOl0h1j6wSUiogKKFdSgmFvEqHCIUyEsEnD8WJTC2eNRYmNjiHWI+Sxx7CMAJRJRwqi0+RJBk9gjaf0S8HMooVJZJKnUiCT42QgZ+wipqEot0lQ6lFJta4GVoaRH2uZTkmqbT2kfCyi1PdKMprY+rWhqrRqOXodS75dy7weIRbYsWCguBBBj1pNFcGBHvMVMOGwCPYZlyBKHYXkyWzXkAMwcNrEuD+NtHpY4f/uf2H3+uHnaf2nuN9Lj/2YWy2GWc4l6or2Sf/d7McvJfF/fF7clHJdnsEe8uazqTbGGr8v9ZlnW7ff8sXguCagXsq3WN1sXlaG4ocg9YUSPWlfVszmNSbar945bPTxVddlaBu5mp+qR1n9Z1XeD5J+K9bpHbFGr9SirI3rUrl71vnGT7DGbYvfYIzoiqJepfNr1C9gV/RKLj8WgtU3b58OMfCZ45/8rw/+CMjRTwV6jD0n9sCx+cEf0j8SqxRFpThRLMthsj7cxGTkz8jeqZcJfqUmTloFURnZM+KPGmLQlgWQoMwbsYL+77g0Mh3PE34OR6KQ1AnBMqskkMtRRFRrIdkhGSdqB6XawHZJwtwdpvldKjZvywmps8TIrYHGiK5DNSbCxxQuyQEw8aXFiLZDNSbeR5SjkAjF60uJEXiCbk3xjixeA4QomLHqqai8VxxYvHAMxYsriReXY4iVmIIZPWpz8DFfNx+2cIE1P2e/GP/q3rf6vl4PHZFUHJQbQAZUBbFBOOH6kKIAfaQfT4Fg+ABtQEMAORQRQYx0B5EhKADehJkzWoaAwVQ01hWlqJCtMU11lkS9mXwA=",
        },
    ],
});
