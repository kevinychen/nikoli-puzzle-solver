import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet, Vector } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions of orthogonally connected cells
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Each region must be an L shape with a width of one cell
    const directions = puzzle.lattice.edgeSharingDirections();
    const maxLength = Math.max(puzzle.height, puzzle.width);
    const lShapes: Vector[][] = [];
    const v = directions[0];
    for (const w of directions) {
        if (w.crossProduct(v) > 0) {
            for (let len1 = 1; len1 < maxLength; len1++) {
                for (let len2 = len1; len2 < maxLength; len2++) {
                    lShapes.push([...range(len1 + 1).map(i => v.scale(i)), ...range(1, len2 + 1).map(i => w.scale(i))]);
                }
            }
        }
    }

    // Find all placements
    const circleGrid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    const arrowGrid = new ValueMap(puzzle.points, _ => cs.enum(directions));
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
                                    .oppositeDirections()
                                    .filter(vs => vs.some(v => placementSet.has(p.translate(v)))).length === 2;
                            return circleGrid.get(p).eq(1).eq(isCircle);
                        }),
                        ...placement.map(p => {
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
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTNbts8ELz7KQKeedCf5US3JI2/i6s2n10EgSAYtK3EQiTTpaSmkOF3z+5SgE1RPbRA0BwKgovRcEnOUhxW3xuhMh5C8y+5w11oXhhSd4OAutO1RV4XWXTBr5t6KxUAzr9Mp/xJFFU2SrqsdHRor6L2nrf/RQnzGKfuspS399Gh/Ry1MW/nMMS4C9wMkMu4B/DuBB9oHNGtJl0HcNxhgI8A17laF9lyppmvUdIuOMN9bmg2QlbKHxnT0+h7LctVjsRK1FBMtc333UjVbORL0+W66ZG311rufECuf5KLUMtFNCAXq3hnuVfp8QjH/j8IXkYJav92gpcnOI8OEOPowDwfpwagRf8bNhkj4Z8REyMD5rk0+xFnezA24UwoJV+X8fKGatKLQrpRKfNCYMdWcoDJAzTqsNYIUIxvJYfBUDKVYrO4RI+FcqZUlEdxAafEW5/iJ4oOxTHFGeXcUXygeEsxoBhSzgTP+bf+xPm5vpOcxPPI1rqN/xyno4TFTbnK1EUsVSkKuIvzrdhnDEzPKlksq0Y9iTVcYXoT4JYCt6MZBlVIuS/ynZmXP++kygaHkMw2z0P5K6k2vdVfRVEYhH7jDErfAoOqFTjt7JvumsGUot4axJkrjZWyXW0KqIUpUbyI3m7lqebjiP1k1OHKO/Cs/HtR/86Lir/A+Whu/mhy6PZKNWh9oAfcD+ygyzveMjrwlqVxQ9vVwA4YG9i+t4Gy7Q2k5XDgfmFyXLXvc1TVtzpuZbkdtzo3fJKO3gA=",
            answer: "m=edit&p=7VVNb5tAEL37V0R73oNhP0i4JWncS+o2daooQpaFHRKjYJMCbios//fMDGsva+ihlaL2UCFWj8fM29mPt1t+38RFwjU84pQPuQePrzW9npT0Ds1zm1ZZEp7w8021zAsAnH8ejfhjnJXJIDJR08G2PgvrG15/DCPmM06vx6a8vgm39aewHvN6Ar8Y94C7BuQx7gO8svCO/iO6bEhvCHhsMMB7gIu0WGTJ7LphvoRRfcsZ9nNB2QjZKv+RsCaNvhf5ap4iMY8rGEy5TF/Mn3LzkD9v2L6LHa/Pm3InPeUKW644lCv6y/Xfv9yz6W4H0/4VCp6FEdb+zcJTCyfhdod1bZkvMFVCLc3asEAhIVpE4ERAnkfZ95jtw7+As7go8tfZeHZBY2pEIdwZKfM1sKoTLEU/rfo0JBYjOsFa9gUHvRI0niMWhjOiQfnU3sIs8VpQ+4HaIbWK2muKuaL2jtpLaiW1mmICnGdYibaGdrOZ5/ncwxmE8Xi+ACwb7CnAyvCyhZHXBkOuaOUK0WDhtzDyRlOAjtjrgKOFtvHS6EjEJlcKdLyJgX6lyRV4GphciThosILzQvk2Vxkd5VuMp4gymhI0ldFU0mLUVNrmaqOpEQsbr42OFhYr0NR7TdDRRkerFob4QFge94hovHDY2c1iT/a7/LAhcLF3gwin/vCoP8fTQcTGm9U8KU7GebGKM3D0ZBm/JAyOTlbm2azcFI/xAg4COlk5cWvKcKgsz1+ydO3GpU/rvEh6fyGZPDz1xc/z4uFI/TXOMoco6aZwqMZLDlUVqfNNjnWYVVwtHaJ1tjlKybpyC6hit8T4OT7qbWXHvBuwn4xeODiGcDj/v5f+zr2ESzD8rdupfde82xH9b5VDuzcveq0PdI/7ge11ueE7Rge+Y2nssOtqYHuMDeyxt4Hq2hvIjsOB+4XJUfXY51jVsdWxq47bsau24aPp4A0=",
        },
        // {
        //     name: "Sashigane (medium)",
        //     puzzle: "m=edit&p=7ZXNbptAEMfvfopoz3vgw2CbW5LGvbikaVJFEUJobZMYBbzuAk2F5XfPzICFF4iqSk3bQ4UZDb+dnZ39+jv/VgoV8wk89pQb3ITHNsb0ugb+js9dUqSxd8bPy2IjFTicX8/n/FGkeTwKmqhwtK9mXnXDq49ewEzGmQWvyUJe3Xj76pNX+by6hSbGTWCLOsgC96p176kdvcsamgb4fuOD+wDuKlGrNI4WNfnsBdUdZzjOBfVGl2Xye8yaOvB7JbNlgmApCphMvkl2TUteruVz2cSa4YFX52+Xa7floluXi95AuTiLdy53Fh4OsOxfoODIC7D2r607bd1bbw/W9/bMdrHrDGqp94aNpwjcFrg2AucIoJ9JvR+gt4W9Hc6EUvIl8qMLmlOdFMK1mbKxUdNOMA3YC3YsoJNesDMZxFRjL8fEHKRNbCfFFKuz+3gw82woB6zJnFbGInsHS80rm+wHsgZZh+yCYq7I3pO9JDsm61LMBDfrl7bzdHPeqZzAGpMyHB/n93+Fo4D5ZbaM1ZkvVSZSOOq3G7GLGWgKy2Ua5aV6FCu4ISQ5cAmAbamHhlIpd2my1eOSp61U8WATwnj9NBS/lGrdyf4i0lQDtYBqqD42GioUXOSTbzpDGslEsdHAyaXXMsXbQi+gEHqJ4ll0RsvaOR9G7AejF869Aar1X7D/jmDjFhj/2j3/STkBrK7tcvrrsJp/il0ZiWgl4brCIjYB1bXGoeWPT4TOvVSDogF4QDeADupDw3sSAbwnBjhgXw+ADkgC0K4qAOoLA8CeNgB7Qx4wa1chsKquSOBQPZ3AoU6lIghHrw==",
        //     answer: "",
        // },
        // {
        //     name: "Sashigane (big)",
        //     puzzle: "m=edit&p=7VbLbtswELz7KwKeeRD1sB63JE16SZ2mThEEgmHQthIbkc2UlptChv89uysVMkXm0KJFDw1kLdaj0e6I1JDafttJXXDh4y9IuMcFHGEa0hnEEZ1ee9yuqrLITvjprloqDQnn15eX/EGW22KQt6zJYF+nWX3D649ZzgTjzIdTsAmvb7J9/SmrR7wewyXGBWBXDcmH9KJL7+g6ZucNKDzIR20O6T2k85Wel8X0qiF+zvL6ljPsc0Z3Y8rW6nvBWh34f67WsxUCM1nBw2yXq+f2yna3UE+7lismB16fNnLHDrlBJxfTRi5mDrkozpSLhf6o3HRyOMCwfwHB0yxH7V+7NOnScbaHOMr2LPTw1iFoaeaGxQSEHSC8uI+IEJH4CAkFIukxkvTvSqIe4gtCkp8ISBIk7B6EBdgj4kxqrV6mo+kZDVejF+jGnLMQC8UWOQqcNaLUyR7ic9psGhCrY4yl7RoJ1ggsOPWdbOFhbbul8PDhXXwsb2lp5sMB4xQ4qvuoxoEH+ExQxsLbrn2cJt1uSzNvwxGy7aEREc6do/oQ1Tj4QyzvGJvkjTGm186Wk7Qq+/R06Gzre1je5vsCp9DBp3fbauv77ZgZdHjlL+nF9ynegkl5HVD8QNGjGFG8Is4FxTuK5xRDikPixGjzX1oIjr33l+TkQUi7in1E7zgek0HORrv1rNAnI6XXsoQlfryUzwWDvZRtVTnd7vSDnMPOQFstLP6AbegOAyqVei5XG5O3etwoXTgvIVgsHl38mdKLXvUXWZYG0Hw8GFDz1htQpWEDO/pPDjCQtayWBnC02RmVik1lCqikKVE+yV63dffMhwH7wegE33qwW79/qPybDxWcAu+3Vyn6Qqiv/4+1s7G/0s4VAGDHIgCo0+wtbvkdcMvZ2NA2N6AOfwPatzhAtssBtIwO2Btex6p9u6OqvuOxlWV6bHXs+3wyeAU=",
        //     answer: "m=edit&p=7VdNb9tGEL3rVwQ887Cf3F3dkjTuxXWa2kUQCIZB20osRLJcSmoKGfrvfbMcaklxfWjRoJdAFvX8NPP2DakZcjd/7OpmXkpFf9qXopR4mWDiWzsb34JfV4vtcj59Vb7ebR/WDUBZvj87Kz/Xy818MuOo68nzPkz3H8r9z9NZIYuyUHjL4rrcf5g+73+Z7i/K/SW+KkoJ7rwNUoDvEvwYvyf0tiWlAL5gDPgJ8G7R3C3nN+dt4K/T2f6qLGidNzGbYLFa/zkv2Af9f7de3S6IuK23KGbzsHjibza7+/XXXdEtcSj3r1u7lxm7OtnVR7s6b1eN7Mr/2m64Phxw2n+D4ZvpjLz/nqBP8HL6fCBfz4URlFrBS3ttChcJkwgp3CkjDTGuxxhJTOgz/jTL2xNGycj4joElGY19gjFNa9iyqJtm/e3m4uZNPF2tX4QPrnlhSMiNgq3OatiQja5cNtplV3Q6q+FJQ4/ooLLRUojsklKYF+Jdzkt7PTK0z6srlee1bmVGvMvz8aKPl41XfkxbmT010tq8eqXz8ZXPnxv/wjn2NmvH+/yyocouq4TKxisp8vEyu6xSMiODn/xZ/OGreLxCk5Z7HY8/xaOIRxuP5zHmXTx+jMe38WjisYoxjtocg6CvUQ2zC+VDqQLcw7zCcFdBtjhIYMVYAWvGGtgwNsC2xV4AV4wp13GMA/aMPXDgGNxQBK8bBHB1XFeLNhfcEZMHLTzzHjgwDqWWnQ5uULLzj1zZ+gfXw9CR+uhHS8O8PmJ4BLasD2+ySn4U6yjoKJ38KNZRuodRo2IdCR1VJT/KJT/KJw+K61LwoAXzqEu3dYFLWMKPZj9a9rADZk3cxrUOyY9hTR0SVtA3rKmgaboaoWO4RqMSVtA0XKMhTZu8Ga7R2ITJm+F6NemwN4t6LetY6FjWsci1nQ5yLefaKmHyYzsdl7AhzZC8VVxjBW8V11hBs+IaDXIrrqtSCRvUWLE3h1zHuQ65TqV1Hcc71cPw4Lq6Aj00MW8SJj+Oa3Soy3FdjjS5FgcPjmupkOu5Fhd6GDqedTxyvU8ePOd638PIDV0uzjP3u6a+437X1GtBJw/c7+B6GH649zX1Hfe+pr7j3oev0gh19GZEq2kEHihFlyuAK+btEZMfw70P7ojJm+nmAPwYngMG/WWkPHow3O/gEhbIlZ55l7CAjux0fMLkUwnmQ8IKaynJGPqq04em6mqEDs8BeAS2ySfPAXAJk0+eCfgEZm+KdELyoFlHm4TJg+ZcXSWMGWV0p4MaeQ6ASxgzwfAcwCdwVxd0eA6A62Fo8hyI3ngOgEuYvFnW1KjRyuTNso6VPQxNq5M3ngngEsa8Mjwf8AnM582SJteLfjQ8B6IfngPgehg6PBPwCczeLOFOE/7pgU+3j8fHJ9L2BnzZPZ0eb9J0Az5MZihbZl/2B0+v68msuNitbufNq4t1s6qX2LxcPtRP8wK7xGKzXt5sds3n+g57nriJLCP3GDMG1HK9flouHodxiy+P62ae/YrI+f2XXPzturk/Uf9WL5cDYhO3xQOqfZ4bUNtmMfg/PtsNmFW9fRgQvW3cQGn+uB0a2NZDi/XX+mS1Var5MCn+KuIbT6S4O/zYgv9PW3C6BOIfbcRHe9/9+++2K/h3rr6XnfgjXjfZCQA6MwTAZpud+VG/gx91Ni04bm6wmf4Ge9rioMZdDnLU6OBe6HVSPW13cnXa8bTUqOlpqX7fz64nfwM=",
        // },
    ],
});
