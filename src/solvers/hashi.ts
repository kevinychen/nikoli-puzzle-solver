import { Constraints, Context, Point, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Bridges must be horizontal or vertical lines between two islands, and cannot make a turn
    const edges: [Point, ValueSet<Point>, Point][] = [];
    for (const [p] of puzzle.texts) {
        for (const bearing of puzzle.lattice.bearings()) {
            const sightLine = puzzle.points.lineFrom(p, bearing).slice(1);
            const i = sightLine.findIndex(p => puzzle.texts.has(p));
            if (i !== -1) {
                edges.push([p, new ValueSet(sightLine.slice(0, i)), sightLine[i]]);
            }
        }
    }

    // Draw bridges to connect the islands
    // There can be at most two bridges between each pair of islands
    const grid = new ValueMap(edges, _ => cs.int(0, 2));
    for (const [p, middle, q] of edges) {
        cs.add(grid.get([p, middle, q]).eq(grid.get([q, middle, p])));
    }

    // Bridges cannot intersect
    for (const edge1 of edges) {
        for (const edge2 of edges) {
            const [[p1, middle1, _], [p2, middle2, q2]] = [edge1, edge2];
            if (!p1.eq(p2) && !p1.eq(q2) && [...middle1].some(p => middle2.has(p))) {
                cs.add(Or(grid.get(edge1).eq(0), grid.get(edge2).eq(0)));
            }
        }
    }

    // Numbers indicate the total amount of bridges that are connected to that island
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...edges.filter(([q]) => q.eq(p)).map(edge => grid.get(edge))).eq(parseInt(text)));
    }

    // The islands are connected into one network
    const tree = new ValueMap(edges, _ => cs.int());
    const root = cs.choice(edges);
    for (const edge of edges) {
        const [p1, _, q1] = edge;
        cs.add(
            Or(
                root.is(edge),
                ...edges
                    .filter(([p2, _, q2]) => p1.eq(q2) || q1.eq(p2))
                    .map(otherEdge => And(grid.get(otherEdge).neq(0), tree.get(otherEdge).lt(tree.get(edge))))
            )
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved bridges
    for (const [[p, middle, q], arith] of grid) {
        const value = model.get(arith);
        if (value) {
            const points = [p, ...middle, q];
            const shape = value === 2 ? 30 : 3;
            for (let i = 1; i < points.length; i++) {
                solution.lines.set([points[i - 1], points[i]], shape);
            }
        }
    }
};

solverRegistry.push({
    name: "Hashiwokakero",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRNb9s8DL7nVxQ66+CvfPnWdckuWbYuGYpCMAIlcRujdtRXttfBQf57ScqBo9gFBmwoenihmKQeM+RjSY/y/0qpYz6E4Y+4w10YvhPQM3DwdxrLpEjj8Ipfl8VOaQg4/zad8geZ5nFP1FlR71CNw+qWV19CwVzGmQePyyJe3YaH6mtYLXi1gFeMu4DNTJIH4aQJ7+g9RjcGdB2I5yYOILyHcJPoTRqvZqbQ91BUS86wzyf6N4YsU79iVvPA+UZl6wSBncx3SQ3m5VY9lXWaGx15df02U79hiqFhilEHU/yAv2a6lgUsO7B97qI7jo5HWPEfQHgVCuT+swlHTbgID8wLWOhy5jvkgiG5vpn1PePG5AYjciPXOJ/c2MzGA3BQcV5XFMyHPTFbTLUF7vgJwC4WgP1sADrbAHCwAGRjAcjLaosMrQzkagPA+gwA/m54AHtPdkrWI7uEBeOVT/YzWYdsn+yMciZk78jekA3IDihniEv+h5tiFvId6AgvIGmfRv/fz6KeYJPtY3w1VzqTKYOrgOUqXeWlfpAbON10U8ABBmxfZutYW1Cq1HOa7O285HGvdNz5CsEY2nXkr5XeXlR/kWlqAebesyCjUwsqNIjwbC61Vi8WksliZwFngrUqxfvCJlBIm6J8khfdsuabjz32m9EjfLhn/f/v2fe/Z3H1nY8m7I9Ghw6u0p2qB7hD+IB2CrzGWxoHvKVmbNgWNKAdmgb0UtYAtZUNYEvcgL2hb6x6KXFkdalybNUSOrY617qIeq8=",
            answer: "m=edit&p=7VVNb9swDL3nVxQ682DZki351nXtLl23Lh2KwQgKJ3WboE7cOck6OMh/HynmS44L7NANOwyOqecnmnomQ2n+fZnXBSR4RQYCkHhFgXJ3HNBve91MFmWRnsDpcjGuagQAny4u4CEv50Uv23gNeqvGps01NB/STEgBIsRbigE01+mq+Zg2fWj6OCVAInfJTiHC8z28dfOEzpiUAeIrxgrhN4SjST0qi7tLDvQ5zZobELTOO/c2QTGtfhRio4OeR9V0OCFinM/Hkw05X95XT8uNmxysoTl9XWm0VxrtlEbdSsO3UDrMF5h2VPvcJdcO1mvM+BcUfJdmpP3rHpo97KcrESqRShBR4AaVuEHzkw55sG6IjRuM5CFyg+UnG+Owpm/kiJmIsCZcYhc7o4pvCVrFI3Tbg1b2CdsiSI1HkC5vWVLoeVjZJmKPQP0yXa2pPGQvnA2dvcGEQRM5+97ZwFnt7KXzOXf21tkzZ5WzsfNJKOVYlMMY8fZtzBmEWqQRNoaGMGYUQ5gwSiA0jAyElpEFyishbEt6N8BMa1AxQxWDThjqBChbziEAJd1bSgIlmVACiqMrA4qjKws62M5qntUGYp6NLRieNQFYjqdxV2AUS0g4chICFYFmQ4gZxREkimcVGP5mo8HyN2sLScBSkwCopASNBMMRzS6ilWCZsyHYDReB5dhWgeXYdhN7V6ArZ7nQXMT+QdG50FTEdS/DzMqDS7/906CXifP7x+LkqqqneSlwoxTzqrybL+uHfIS97/ZRcNxsOR0WtUeVVfVcTma+3+RxVtVF5xSRBS7X4T+s6vtW9Je8LD1i7k4Fj+JdzKMW9cR7zuu6evGYab4Ye8TBduZFKmYLX8Ai9yXmT3lrten+m9c98VO4O4vwFIr+n0J//xSi7Ae/eRa1mvNP7sL/lhz3x63qzq5HuqPxke1s8A1/1OPIH3UzLXjc0Mh29DSy7bZG6rizkTxqbuRe6W+K2m5xUtXuclrqqNFpqcNezwa9Xw==",
        },
    ],
});
