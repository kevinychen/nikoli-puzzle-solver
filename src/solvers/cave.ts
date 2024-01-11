import { Constraints, Context, PointSet, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form a cave
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    for (const [p, arith] of grid) {
        if (!puzzle.points.has(p)) {
            cs.add(arith.eq(1));
        }
    }

    // All shaded cells are connected through other shaded cells to the outside of the grid
    const expandedPoints = new PointSet(
        puzzle.lattice,
        [...puzzle.points].flatMap(p => puzzle.lattice.vertexSharingPoints(p))
    );
    cs.addAllConnected(expandedPoints, p => Or(!grid.has(p) || grid.get(p).eq(1)));

    // Numbers cannot be shaded
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // Clues represent the total number of unshaded cells that can be seen in a straight line
    // vertically or horizontally, including itself
    for (const [p, text] of puzzle.texts) {
        cs.addSightLineCount(puzzle.lattice, puzzle.points, p, p => grid.get(p).eq(0), parseInt(text));
    }

    // All unshaded cells on the board form an orthogonally connected area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(0));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Cave",
    keywords: ["Bag", "Corral"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv/BWVzz7wI2lTbl3X7JKxtclUVQhFTkIbVIg7A+vkKP9733umIwYmbYdtPUwOT4+PH/bXsb8uv9ZCpXwMLZhwl3vQfH9Cz8jF32tbZFWehif8oq62UkHC+afplN+LvEyduKlKnL0+D/U11x/CmHmMMx8ejyVcX4d7/THUEddz6GLcAzYzRT6kV216S/2YXRrouZBHTQ7pHaTrTK3zdDkz5HMY6wVnOM87+hpTVshvKWt04PtaFqsMwUpUsJhymz01PWW9kY91U+slB64vjNz5gNyglYupkYvZgFxcxR+We54cDvC334DgZRij9i9tOmnTebiHGIV75nv46Qi0mL1hIxcBbNUPcNYBYwKnrwAG8mi4O4pTij7FBczGdUDxPUWX4pjijGquKN5SvKQ4onhKNWeo97dW9BfkxL4xB7bxr2WJE7OoLlapOomkKkTOwB6slPmyrNW9WMNmk3tgP4HtqNJCuZRPebaz67KHnVTpYBfCdPMwVL+SatMZ/VnkuQXMXWAhc2wtVCk4k0fvQin5bJFCVFsLHJ1fa6R0V9kCKmFLFI+iM1vRrvngsO+MnjiAuyf4f/f8o7sHt8B9a359a3Lo9Eo1aH3AA+4HOujyhveMDrxnaZyw72qgA8YG2vU2oL69AfYcDuwnJsdRuz5HVV2r41Q9t+NUx4aPE+cF",
            answer: "m=edit&p=7VRNc9owEL37V2R01sGWbQK+pWnohdKm0MlkPAwjwAme2CiV7aZjxv+9uysIyHZn2kM/Dh3h1epppX2L9FR8qaROeAjNH3KXe9CEGNIXuPg7tnlaZkl0wa+qcqs0OJx/GI/5g8yKxIkPUQtnX4+i+pbX76KYeYwzAZ/HFry+jfb1+6ie8noGU4x7gE1MkAD35uTe0Tx61wb0XPCnBx/ce3DXqV5nyXJikI9RXM85wzxvaDW6LFdfE3bggeO1ylcpAitZQjHFNn0+zBTVRj1V7Jii4fWVoTvroeuf6PqvdP1+uuL30x0tmgb+9k9AeBnFyP3zyR2e3Fm0b5DXngkPlwbAxZwNC1wExBlw2QJCAgZHADbyaLt7smOyguwcsvHaJ/uWrEs2JDuhmBuyd2SvyQZkBxRziXyhovM9Bp3VU7KGhckww9KgEqAoRtT5ZuR7phOmG1IXGDAwkaGJDAfQvZZlSkGajRMLIw5s4c95Cydm0ypfJfpiqnQuMwbyYIXKlkWlH+QaDpvUwwnbUaQFZUo9Z+nOjksfd0onvVMIJpvHvviV0pvW7i8yyyygoLfAgsy1taBSp9ZYaq1eLCSX5dYCzu6vtVOyK20CpbQpyifZypafam4c9o3RF/vw9vj/356/9PbgEbi/9AL9kefj36JDt1fpXukD3KN+QHtVfsA7Qge8I2lM2FU1oD3CBrStbYC68gawo3DAfiBy3LWtc2TVljqm6qgdU50LPl443wE=",
        },
        {
            name: "Cave (hex)",
            puzzle: "m=edit&p=7ZTBb9owFMbv/BWVz0aKk5RCbl1XdmFsHUxVFUUoQFqiJrhzkrUK4n/v917YQkh22GFVD5PJ4+XnZ/sz+PMmepEuNUtaUqE5tsXP0KUPUWrzOE8i70xeFvlGGyRSfhmP5X2YZFHPt4Lerhx55Y0sP3m+UEIKG48SgSxvvF352SunspyhS0gFNqmKbKTXdXrL/ZRdVVBZyKeHHOkd0lVsVkm0mFTkq+eXcylonQ88mlKR6p+ROOig95VOlzGBJN5GLweYFWv9WBzKVLCX5WWldNah1KmVUloppaxDKW3g3ykdBfs9fuxv0LrwfJL9vU6HdTrzdohTbyfcAQ0dQUb1j4gLi4Bbg6EiMDgCPAR/4S+glE3k/IjYTH5Pi8UUL3nHcczR5jiHIlk6HD9ytDiec5xwzTXHW45XHF2OA665oD391a7fQI4Pe/SVS6axpS0VmacPG+EbiULi4FxQ7I+ohAvQMxhWQ/oANjptdGEWR4JjBCa1uR8vGEct6PliWqTLyJxNtUnDRMBvItPJIivMfbjCEWIj4qiAbbmygRKtn+hENWD8sNUm6uwiGK0fuuqX2qxPZn8Ok6QBsh9FaJqDKzM0UG5w0o/eQ2P0c4OkYb5pgGWY4xrKNvFTc6ZomzcF5GFTYvgYnqyW1nve98SL4Md3cNU5/y+zN73M6Ie33pu535scPrPadBoeuMPzoJ3ePvCWvcFbRqYF214G7bAz6KmjgdqmBmz5GuwP1qZZT91Nqk4NTku1PE5LHdvcD3qv",
            answer: "m=edit&p=7VTBbptAEL3zFdGe1xK7YAzc0jTuxXWb2lUUIcvCNolRwKQLNBEW/56ZWRqMoYceGvVQrZmdfTOz8xbzdh+9cBuHyU0uYFjSpMe18Wc2YxkXSeRf8Muy2GcKHM6/TKf8PkzyyAjMlXGsPL+64dUnP2CCcSbhEWzFqxv/WH32qzmvFhBiXAA200kS3OvWvaU4elcaFCb488YH9w7cbay2SbSeaeSrH1RLzrDPB6pGl6XZz4g1PHC9zdJNjEASH6KXBszLXfZYsl+717y61EwXA0ytlqn1xtQaZir/KlNvVdfwsr8B17UfIO3vreu27sI/1kjpyGwHSz2gof8RNjERsFvAFQg4JwCVyBYQQiIyPkGk7GwLzQS1vCM7JSvJLoERryyyH8maZMdkZ5RzTfaW7BVZm6xDORM8E5z6dA+nVz0nq1noDgs8vs18oGiPaRpPaHI8miaSJtfSk05xdYrXTK6edIEwcfl2Sn0yZF0bAahlJGzUkOSSC9TSyCZNgSPAsbi2Iw9TKAEijqtLRgBICEoI2ZjmUgVsKikOC48qxMoI2LxMN5G6mGcqDRMG8mN5lqzzUt2HW/iiSJecsANldqAky57wA+uA8cMhU9FgCMFo9zCUv8nU7mz35zBJOkD+owxVt1hrowMVKu6sQ6Wy5w6ShsW+A2zCAm6lfB8/dXeKDkWXQBF2KYaP4Vm3tD1zbbAXRk9gwc1n/b/b3vVuwxdv/tEN9y5Xz79Fh77ZTA0KHuABzQM6qO0G78kb8J6QsWFfy4AOyBnQc0UD1Bc1gD1dA/YbaeOu5+pGVucCx1Y9jWOrU5kHK+MV",
        },
    ],
});
