import { Arith } from "z3-solver";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw a path from S to G that goes through all cells
    const [network, grid, order] = cs.PathsGrid(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(arith.neq(0));
        cs.add(puzzle.texts.get(p) === "S" ? order.get(p).eq(0) : arith.isTerminal().eq(puzzle.texts.get(p) === "G"));
    }

    // An outlined region can be entered and exited multiple times
    const entranceIndex = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p, q, v] of puzzle.points.edges()) {
        if (!puzzle.borders.has([p, q])) {
            cs.add(Implies(grid.get(p).hasDirection(v), entranceIndex.get(p).eq(entranceIndex.get(q))));
        }
    }
    const regions = puzzle.regions();
    for (const [p, q, v] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            // If this cell exits to another region, then any future cells in this region must have
            // a strictly higher entrance index. Ditto for entering a region.
            for (const cmp of [(a: Arith, b: Arith) => a.gt(b), (a: Arith, b: Arith) => a.lt(b)]) {
                cs.add(
                    Implies(
                        And(grid.get(p).hasDirection(v), cmp(order.get(q), order.get(p))),
                        And(
                            ...regions
                                .get(p)
                                .map(r =>
                                    Implies(
                                        cmp(order.get(r), order.get(p)),
                                        cmp(entranceIndex.get(r), entranceIndex.get(p))
                                    )
                                )
                        )
                    )
                );
            }
        }
    }
    for (const region of regions) {
        cs.add(Or(...region.map(p => entranceIndex.get(p).eq(1))));
    }
    for (const [p, arith] of entranceIndex) {
        cs.add(Or(arith.eq(1), ...regions.get(p).map(q => entranceIndex.get(q).eq(arith.sub(1)))));
    }

    // A number N indicates that the path must go through that cell on the region's Nth visit
    for (const [p, text] of puzzle.texts) {
        if (!"SG".includes(text)) {
            cs.add(entranceIndex.get(p).eq(parseInt(text)));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved path
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Haisu",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTdb5s+FH3PX1H52Q/YkDbw1vWX9qXL1iVTVSEUkYS2qBB3BtafiPK/91xDRviYtmma1ofJydXh+Nr3+OM4+1KEOuJjNHvCLS7QpJyYv2PR79AWcZ5E3gk/L/JHpQE4/3B5ye/DJItGfp0VjHal65U3vLzyfCYYZxJ/wQJe3ni78r1XTnk5RxfjAtx1lSQBpw28Nf2ELipSWMCzGgPeAa5jvU6i5XXFfPT8csEZ1XlnRhNkqfoasVoHfa9VuoqJWIU5FpM9xs91T1Zs1FNR54pgz8vzSu58QK7dyCVYySU0IJdW8YflusF+j23/BMFLzyftnxs4aeDc2yHOvB2TgobiZER1Nkw6RFw1hD057EVNOFZniCOJsBtifErE/IhwW3OgtjAK7ky8NFGauIBAXtom/meiZeLYxGuTM4Vu18He2syTmNCyuRDQQFhI4JoX4GXNS/A21krYxt0+YHmGHKzQ4An4M4PdMabHTpjpqdS4TnGRgvV/wzQUkm6NsAsTHRNPjeAz2u9fOpHf35sfyvFlZW5qWOfPoGDks+nmITqZKZ2GCe7erEhXkT58w+wsU8kyK/R9uMbVNW8Bbie4rclsUYlSz0m8befFD1ulo8EuIiOUH8hfKb3pzP4SJkmLqF62FlWZsEXlGg47+g61Vi8tJg3zxxZx5MbWTNE2bwvIw7bE8CnsVEubNe9H7H9m/r6Nl9T+95L+pZeUjsB6a+59a3LM7VV60PqgB9wPdtDlNd8zOviepalg39VgB4wNtuttUH17g+w5HNx3TE6zdn1OqrpWp1I9t1OpY8P7wegV",
            answer: "m=edit&p=7VRNb5tAEL37V0R7ngP7ZQO3NHVySdOmTlVFyIqwQxIUbFLATYXFf8/M7hKMTaVUVdUeKmD1eLs78/bjTfltExcJaHykDx5wfITwzac8etvnKq2yJDyC4031kBcIAD6ensJdnJXJKHKj5qNtHYT1JdRnYcQ4Aybw42wO9WW4rT+E9RTqGXYx4Mid20EC4bSDX00/oRNLcg/xhcMIrxEu02KZJTfnlvkURvUVMMrzzswmyFb594Q5HfS/zFeLlIhFXOFiyof0yfWUm9v8ccPaFA3Ux1bubECu7OTKV7lyWK7483KDedPgtn9GwTdhRNq/dNDv4CzcNqRrywSnqXgy3J4NE4qIs46QfrsXjlDe3hQliJAdocdEzHaIoBcDc3Oj4Nq0p6YVpr1CgVBL0743rWdabdpzM2aKugOFeytZKDCgJ4FzYTEXiB3PkReOF8hLbrH0OiwmOMZ32Ed+YnCgMbxy4SmVdkMCHOLtYJra0MGTsBPTKtOOjeAJ7TeeyO6Cxu1SmPCA9l+CQYFFZDqLBAhpkQTpOAXScQGQEES4HGmjSA7KcQKU4yQoOxdNLYMWqYlFASjfIHK47VW8naEmQEdJyAdtZ6gAtM2hPdA2h+YwdhzOsPE0zrDxdGB77cnZe/d6A+zpznZug70BtKHNKBK2DNGj34bmo4hNb++To4u8WMUZuuRis1okRfuPZYmVeXZTboq7eIkmM1ULDLc2I3tUludPWbruj0vv13mRDHYRmWD6gfGLvLjdi/4cZ1mPKE0N7lG2XPSoqkh7/3FR5M89ZhVXDz1ip270IiXrqi+givsS48d4L9uqW3MzYj+Y+SKJNV/+r/l/qebTEXi/VPl/vwa/oez9W3LM7c2LQesjPeB+ZAdd7vgDoyN/YGlKeOhqZAeMjey+t5E6tDeSBw5H7icmp6j7PidV+1anVAdup1S7ho/moxc=",
        },
    ],
});
