import { range } from "lodash";
import { Constraints, Context, Network, Point, PointSet, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ And, If, Not, Or, Xor }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a path. When the path visits a cell twice, it must travel in a straight line each time
    const network = Network.all(puzzle.lattice);
    const points = new PointSet(puzzle.lattice, [
        ...puzzle.points,
        ...[...puzzle.junctionSymbols.keys()].flatMap(vs => [...vs]),
    ]);
    const grid = cs.NetworkGrid(points, network);
    for (const [_, arith] of grid) {
        cs.add(Or(arith.isLoopSegment(), arith.isStraight()));
    }

    // Find the order of the path
    const edges = points.edges().map(([p, _, v]) => [p, v] as [Point, Vector]);
    const root = cs.int();
    const order = new ValueMap(edges, _ => cs.int());
    for (const [p, v] of edges) {
        cs.add(
            If(
                grid.get(p).hasDirection(v),
                Xor(order.get([p, v]).eq(-1), order.get([p.translate(v), v.negate()]).eq(-1)),
                order.get([p, v]).eq(-1)
            )
        );
        cs.add(
            Or(
                order.get([p, v]).eq(-1),
                root.eq(edges.findIndex(([q, w]) => q.eq(p) && w.eq(v))),
                ...points
                    .edgeSharingNeighbors(p)
                    .map(([q, w]) =>
                        And(
                            w.eq(v.negate()) || Not(grid.get(p).isStraight()),
                            order.get([q, w.negate()]).neq(-1),
                            order.get([q, w.negate()]).eq(order.get([p, v]).sub(1))
                        )
                    )
            )
        );
    }

    // The numbers to the left/right of the rows indicate the number of cells visited by the nearest
    // section of the loop that travels horizontally in that row
    // Likewise, the numbers to the top/bottom of the columns indicate the number of cells visited
    // by the nearest section of the loop that travels vertically in that column
    for (const [p, v] of puzzle.points.entrances()) {
        if (puzzle.texts.has(p)) {
            const line = puzzle.points.sightLine(p.translate(v), v);
            const length = parseInt(puzzle.texts.get(p));
            cs.add(
                Or(
                    ...range(length, line.length + 1).map(i =>
                        And(
                            ...range(i - length).map(j => Not(grid.get(line[j]).hasDirection(v))),
                            ...range(i - length, i - 1).map(j => grid.get(line[j]).hasDirection(v)),
                            Not(grid.get(line[i - 1]).hasDirection(v))
                        )
                    )
                )
            );
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
    name: "Round Trip",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv+Ssqn33AOGkDt65rdsmydclUVQhFTkIbVIg7A+tElP+97z2YwEAPm7Sth8ny0+PjH+9r4OvsW6FMxKfQ5JQ7XECTY5e663jUnbqt4jyJ/DN+WeR7bSDh/NNsxu9VkkWjAFdCC0fH0vPLG15+8AMmGGcudMFCXt74x/KjXy54uYQhxqfA5tUkF9LrJr2lccyuKigcyBd1DukdpNvYbJNoPa/IZz8oV5xhnXe0GlOW6u8Rq3Xg81anmxjBRuVwmGwfP9UjWbHTj0U9V4QnXl5Wcpc/5WKVWq5s5GJaycVsQC6e4g/L9cLTCV77FxC89gPU/rVJp0269I8QF/6RuR4uhS8jqm/DpEBw3gIuAtkCUwTjBkycDvBkBwhn0tlECKrTKiwEFZq0ydhaBZIFCb+jOKPoUlzBuXgpKb6n6FCcUJzTnGuKtxSvKI4pntOcC3wzv/Tu/oKcQHqVmahd/H4ejgK2KNJNZM4W2qQqYWBPlulknRXmXm3hZyP3wv8E7EAzLZRo/ZTEB3te/HDQJhocQhjtHobmb7TZdXZ/Vkligeo2slBlGwvlBjzRelbG6GeLpCrfW6DlH2un6JDbAnJlS1SPqlMtbc58GrEfjHog4X6U/+++f3T34Sdw3pqL35oc+nu1GbQ+4AH3Ax10ec17RgfeszQW7Lsa6ICxgXa9Dahvb4A9hwN7xeS4a9fnqKprdSzVczuWahs+CEcv",
            answer: "m=edit&p=7VXLbtswELz7KwKe90CKEvW4pWnSS+o2dYogEIxAdpREiGylktwUMvzvXS71tnpogT4OhaDFeLhLjrgesviyi/IYPHykBxwEPtK26LW4Ty+vn+ukTOPgBE535VOWIwD4cHEBD1FaxLNQUK1YzvaVH1RXUL0LQiYYMAtfwZZQXQX76n1QzaFa4BADD7lLk2QhPO/gDY1rdGZIwRHPa4zwFuE6yddpfHdpmI9BWF0D0+u8oWoN2Sb7GrNah/69zjarRBOrqMSPKZ6Sl3qk2N1nzzvWLHGA6tTIXTRyRSdXdnJlK1dOy7V+v1x/eTjgtn9CwXdBqLV/7qDXwUWwP2hde2b5uhQ7I0xvmBSaUD3C0oTsEZ4m7I5w+Ijw5YgQ3BlNIoQYLSwELeT0GXtQhZIFCb+leEHRoniN3wWVpPiWIqfoULyknHOKNxTPKNoUFeW4emdw7/pzqKaa2RxsFCxBI8cySIBdIwtsaZAExyHkiCYPkTKjjgVOi5RtEFbUyAalDHJAuYSUbPIUjjoNck2ecpoKpdoKBa5nkAuqRa5vEPqbE3KdZhZEnql1sbZFnql13WY+1wff7IHHwTff5rlNnoejvEGCm0SfNyW+aEoQCW52AdMQWzW2ar5t1Zyiablp56LXftNy3c7DLJQ+iPZxfx0vZyGb7zarOD+ZZ/kmShkeY6zI0rtilz9EazQlnXJA3JYyB1SaZS9psh3mJY/bLI8nhzQZ3z9O5a+y/H40+2uUpgOioFN7QJnjZUCVeTL4HeV59jpgNlH5NCB658xgpnhbDgWU0VBi9ByNVtt033yYsW+M3lDiPSL/3xF/6Y7QLeA/dVP8kcP335JD/94sn7Q+0hPuR3bS5TV/ZHTkjyytFzx2NbITxkZ27G2kju2N5JHDkfuByfWsY59rVWOr66WO3K6X6hs+XM6+Aw==",
        },
    ],
});
