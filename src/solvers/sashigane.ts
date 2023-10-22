import { Constraints, Context, Point, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions of orthogonally connected cells
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Each region must be an L shape with a width of one cell
    const maxLength = Math.max(puzzle.height, puzzle.width);
    const lShapes: Point[][] = [];
    for (const p of puzzle.lattice.representativeCells()) {
        const bearing1 = puzzle.lattice.bearings()[0];
        for (const bearing2 of puzzle.lattice.bearings()) {
            if (
                bearing1.from(p).dotProduct(bearing2.from(p)) === 0 &&
                bearing1.from(p).crossProduct(bearing2.from(p)) > 0
            ) {
                for (let len1 = 1; len1 < maxLength; len1++) {
                    for (let len2 = len1; len2 < maxLength; len2++) {
                        lShapes.push([...bearing1.line(p, len1 + 1), ...bearing2.line(p, len2 + 1).slice(1)]);
                    }
                }
            }
        }
    }

    // Find all placements
    const circleGrid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    const arrowGrid = new ValueMap(puzzle.points, p => cs.choice(puzzle.lattice.edgeSharingDirections(p)));
    const sizeGrid = new ValueMap(puzzle.points, _ => cs.int());
    const placements = puzzle.points.placements(lShapes);
    for (const [p] of grid) {
        cs.add(
            Or(
                ...placements.get(p).map(([placement, instance, type]) => {
                    const placementSet = new ValueSet(placement);
                    return And(
                        ...placement.map(p => grid.get(p).eq(type)),
                        ...placement.map(p => {
                            const isCircle =
                                puzzle.lattice
                                    .bearings()
                                    .filter(bearing =>
                                        [bearing, bearing.negate()].some(bearing => placementSet.has(bearing.next(p)))
                                    ).length === 4;
                            return circleGrid.get(p).eq(1).eq(isCircle);
                        }),
                        ...placement.map(p => {
                            const directions = puzzle.lattice.edgeSharingDirections(p);
                            const v = directions.find(v =>
                                directions.every(w => placementSet.has(p.translate(w)) === w.eq(v))
                            );
                            return v ? arrowGrid.get(p).is(v) : arrowGrid.get(p).eq(-1);
                        }),
                        ...placement.map(p => sizeGrid.get(p).eq(lShapes[instance].length))
                    );
                })
            )
        );
    }

    for (const [p, symbol] of puzzle.symbols) {
        if (symbol.isCircle()) {
            // A circle must be located in the corner of an L shape
            cs.add(circleGrid.get(p).eq(1));
        } else {
            // Arrows must be located on the ends of an L shape, and point towards the corner
            const [v] = symbol.getArrows();
            cs.add(arrowGrid.get(p).is(v));
        }
    }

    // A number indicates the amount of cells contained in the L shape
    for (const [p, text] of puzzle.texts) {
        cs.add(sizeGrid.get(p).eq(parseInt(text)));
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
    name: "Sashigane",
    keywords: ["L Route"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTNbts8ELz7KQKeedCf5US3JI2/i6s2n10EgSAYtK3EQiTTpaSmkOF3z+5SgE1RPbRA0BwKgovRcEnOUhxW3xuhMh5C8y+5w11oXhhSd4OAutO1RV4XWXTBr5t6KxUAzr9Mp/xJFFU2SrqsdHRor6L2nrf/RQnzGKfuspS399Gh/Ry1MW/nMMS4C9wMkMu4B/DuBB9oHNGtJl0HcNxhgI8A17laF9lyppmvUdIuOMN9bmg2QlbKHxnT0+h7LctVjsRK1FBMtc333UjVbORL0+W66ZG311rufECuf5KLUMtFNCAXq3hnuVfp8QjH/j8IXkYJav92gpcnOI8OEOPowDwfpwagRf8bNhkj4Z8REyMD5rk0+xFnezA24UwoJV+X8fKGatKLQrpRKfNCYMdWcoDJAzTqsNYIUIxvJYfBUDKVYrO4RI+FcqZUlEdxAafEW5/iJ4oOxTHFGeXcUXygeEsxoBhSzgTP+bf+xPm5vpOcxPPI1rqN/xyno4TFTbnK1EUsVSkKuIvzrdhnDEzPKlksq0Y9iTVcYXoT4JYCt6MZBlVIuS/ynZmXP++kygaHkMw2z0P5K6k2vdVfRVEYhH7jDErfAoOqFTjt7JvumsGUot4axJkrjZWyXW0KqIUpUbyI3m7lqebjiP1k1OHKO/Cs/HtR/86Lir/A+Whu/mhy6PZKNWh9oAfcD+ygyzveMjrwlqVxQ9vVwA4YG9i+t4Gy7Q2k5XDgfmFyXLXvc1TVtzpuZbkdtzo3fJKO3gA=",
            answer: "m=edit&p=7VVNb5tAEL37V0R73oNhP0i4JWnci+s2tasoQpaFbRKjYOMCbios//fMDGvDGnpopag9VIjV4zHzdvbj7ebfd2EWcQ2PuOR97sDjak2vIyW9ffNM4iKJ/At+vStWaQaA88+DAX8KkzzqBSZq2tuXV355z8uPfsBcxul12JSX9/6+/OSXI16O4RfjDnBDQA7jLsC7Gj7Qf0S3Fen0AY8MBvgIcBFniySaDSvmix+UE86wnxvKRsjW6Y+IVWn0vUjX8xiJeVjAYPJVvDV/8t0yfdmxYxcHXl5X5Y47yhV1ueJUrugu133/cq+mhwNM+1coeOYHWPu3Gl7WcOzvD1jXnrkCUyXUUq0N8xQSokF4VgTkOZT9iNku/PM4C7MsfZ2NZjc0pkoUwq2RMlcDq1rBUnTTqktDYjGiFaxlV7DXKUHjOWNhOAMalEvtBGaJl4LaD9T2qVXUDinmjtoHam+pldRqivFwnmElmhrazmaO43IHZxDG47gCsDQY3OaqCjuqxi5ibTDkCpMrEIta54gFYqMpQFMcdcDRQte50uhIxCZXCnS8iYF+pckVeBqYXInYq7CC80IZHQU6qqFzwlCDMpoKsdGUqoFBU+laRxtNjdjoaNDUDZ0TBh1tdDTio46uMeZ6oo7BPSIqL5x2drXY4+MuP20IXOxDL8CpPz3qz/G0F7DRbj2PsotRmq3DBBw9XoXbiMHRyfI0meW77ClcwEFAJysnbkMZFpWk6TaJN3Zc/LxJs6jzF5LR8rkrfp5myzP11zBJLCKnm8KiKi9ZVJHF1jc51mLWYbGyiMbZZilFm8IuoAjtEsOX8Ky3dT3mQ4/9ZPTCwdGHw/n/vfR37iVcgv5v3U7Nu+bdjuh/qxzavWnWaX2gO9wPbKfLDd8yOvAtS2OHbVcD22FsYM+9DVTb3kC2HA7cL0yOquc+x6rOrY5dtdyOXTUNH0x7bw==",
        },
        // {
        //     name: "Sashigane (medium)",
        //     puzzle: "m=edit&p=7ZXNbptAEMfvfopoz3vgw2CbW5LGvbikaVJFEUJobZMYBbzuAk2F5XfPzICFF4iqSk3bQ4UZDb+dnZ39+jv/VgoV8wk89pQb3ITHNsb0ugb+js9dUqSxd8bPy2IjFTicX8/n/FGkeTwKmqhwtK9mXnXDq49ewEzGmQWvyUJe3Xj76pNX+by6hSbGTWCLOsgC96p176kdvcsamgb4fuOD+wDuKlGrNI4WNfnsBdUdZzjOBfVGl2Xye8yaOvB7JbNlgmApCphMvkl2TUteruVz2cSa4YFX52+Xa7floluXi95AuTiLdy53Fh4OsOxfoODIC7D2r607bd1bbw/W9/bMdrHrDGqp94aNpwjcFrg2AucIoJ9JvR+gt4W9Hc6EUvIl8qMLmlOdFMK1mbKxUdNOMA3YC3YsoJNesDMZxFRjL8fEHKRNbCfFFKuz+3gw82woB6zJnFbGInsHS80rm+wHsgZZh+yCYq7I3pO9JDsm61LMBDfrl7bzdHPeqZzAGpMyHB/n93+Fo4D5ZbaM1ZkvVSZSOOq3G7GLGWgKy2Ua5aV6FCu4ISQ5cAmAbamHhlIpd2my1eOSp61U8WATwnj9NBS/lGrdyf4i0lQDtYBqqD42GioUXOSTbzpDGslEsdHAyaXXMsXbQi+gEHqJ4ll0RsvaOR9G7AejF869Aar1X7D/jmDjFhj/2j3/STkBrK7tcvrrsJp/il0ZiWgl4brCIjYB1bXGoeWPT4TOvVSDogF4QDeADupDw3sSAbwnBjhgXw+ADkgC0K4qAOoLA8CeNgB7Qx4wa1chsKquSOBQPZ3AoU6lIghHrw==",
        //     answer: "",
        // },
        // {
        //     name: "Sashigane (big)",
        //     puzzle: "m=edit&p=7VbLbtswELz7KwKeeRD1sB63JE16SZ2mThEEgmHQthIbkc2UlptChv89uysVMkXm0KJFDw1kLdaj0e6I1JDafttJXXDh4y9IuMcFHGEa0hnEEZ1ee9yuqrLITvjprloqDQnn15eX/EGW22KQt6zJYF+nWX3D649ZzgTjzIdTsAmvb7J9/SmrR7wewyXGBWBXDcmH9KJL7+g6ZucNKDzIR20O6T2k85Wel8X0qiF+zvL6ljPsc0Z3Y8rW6nvBWh34f67WsxUCM1nBw2yXq+f2yna3UE+7lismB16fNnLHDrlBJxfTRi5mDrkozpSLhf6o3HRyOMCwfwHB0yxH7V+7NOnScbaHOMr2LPTw1iFoaeaGxQSEHSC8uI+IEJH4CAkFIukxkvTvSqIe4gtCkp8ISBIk7B6EBdgj4kxqrV6mo+kZDVejF+jGnLMQC8UWOQqcNaLUyR7ic9psGhCrY4yl7RoJ1ggsOPWdbOFhbbul8PDhXXwsb2lp5sMB4xQ4qvuoxoEH+ExQxsLbrn2cJt1uSzNvwxGy7aEREc6do/oQ1Tj4QyzvGJvkjTGm186Wk7Qq+/R06Gzre1je5vsCp9DBp3fbauv77ZgZdHjlL+nF9ynegkl5HVD8QNGjGFG8Is4FxTuK5xRDikPixGjzX1oIjr33l+TkQUi7in1E7zgek0HORrv1rNAnI6XXsoQlfryUzwWDvZRtVTnd7vSDnMPOQFstLP6AbegOAyqVei5XG5O3etwoXTgvIVgsHl38mdKLXvUXWZYG0Hw8GFDz1htQpWEDO/pPDjCQtayWBnC02RmVik1lCqikKVE+yV63dffMhwH7wegE33qwW79/qPybDxWcAu+3Vyn6Qqiv/4+1s7G/0s4VAGDHIgCo0+wtbvkdcMvZ2NA2N6AOfwPatzhAtssBtIwO2Btex6p9u6OqvuOxlWV6bHXs+3wyeAU=",
        //     answer: "",
        // },
    ],
});
