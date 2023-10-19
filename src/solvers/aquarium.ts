import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // The grid represents an aquarium viewed from the side, which must be partially filled with water
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // The numbers around the grid indicate the number of shaded cells in that row/column
    for (const [line, p] of puzzle.points.lines()) {
        if (puzzle.texts.has(p)) {
            cs.add(Sum(...line.map(p => grid.get(p))).eq(parseInt(puzzle.texts.get(p))));
        }
    }

    // Water follows the laws of physics i.e. a single body of water must have the same surface level everywhere
    for (const region of puzzle.regions()) {
        cs.add(Or(...range(puzzle.height + 1).map(y => And(...region.map(p => grid.get(p).eq(p.y >= y ? 1 : 0))))));
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Aquarium",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVdT9swFH3vr0B+9kOcz483xspeujIGE0JRhdISoCJtWJqOKVX/O+faDnHSTNOEtmnSlMY5Pbm+Pv64J5uv27TMeIDLCbnFBS7HcuXtW/RrrstllWfxET/eVg9FCcD52ekpv0vzTTZKhOxrzUa7Oorrc15/iBMmGGc2bsFmvD6Pd/XHuB7z+gKvGBfgJirIBhy38Eq+J3SiSGEBTzUGvAZcLMtFnt1MFPMpTupLzmicd7I3QbYqvmVM66D/i2I1XxIxTytMZvOwfNJvNtvb4nGrY8Vsz+tjJfdiQK7TyiWo5BIakEuz+M1yo9l+j2X/DME3cULav7QwbOFFvEM7jXfM9qirCy1qb5jt94mACOzdKxER4bSEYzWr1RAyqdcSrkxq5PD6Sf2wlzSSSV91QK6Qoq9leypbW7aXmBOvHdm+l60lW0+2ExkzxlSF63NBA9vI6Jk4AMb4EofAmCBhnHjhC41RDb6tsGvEeL2YQMcENheho3DocBG5CkcuMJZHY9tSGE9uC6ySjDf7AkcaRw7iVR48jb4mDywabINv+gpgrQ1YRA028ofgQ82HmFeo5xVEwNiOBtPWyL6IiXQMsG0pjCc0qDy21fIiwLoFzdpizWnPJQbvN+tpYN8Y1wMOGg2GNtqjoMlv6Kd4X8fTfrmUEwfhSh6HE9m6svXlMQmoMH6pdN5+In8qJ3FwSl+vN+DZKGHj2/vsaFqUqzSHdUy3q3lWHk0YbJptivxmsy3v0gVMR7o4fAXcWgZ1qLwonvLluhu3vF8XZTb4isgMIw/Ez4vytpf9Oc3zDqG+SR1K2WeHqkp4o/E/LcviucOs0uqhQxg+2smUrauugCrtSkwf095oq3bO+xH7zuSdOPgKOv+/gX/pG0hbYP3hcm5Npz4zXKc++9dsRxlCUQ56AugBWwA7WP6aP3AA8Ae1TgMeljvYgYoH2y96UId1D/Kg9MH9oPopa98ASFXfA2ioAxugoUwnSGajFw==",
            answer: "m=edit&p=7VVNc5swEL37V2R01gFJIBC3NHV6cZOmSaeTYTwe7JCECTYp4KaDx/+9u5IwH6bTdvp16WBLj6fV7pPQrspP27hIqA+PCKhDGTzCcfVfOvhrnpu0ypLwhJ5uq8e8AEDp5fk5vY+zMplETM915pNdrcL6itZvwogwQgmHPyNzWl+Fu/ptWE9pfQ1DhDLgZsaIA5y28KMeR3RmSOYAvrAY4C3AVVqssmQxM8y7MKpvKME4r/RshGSdf06I1YHvq3y9TJFYxhUspnxMn+1Iub3Ln7akCbGn9amRez0iV7RyxUGuGJfL/7xcNd/vYdvfg+BFGKH2Dy0MWngd7vaoa0e4h1Nd0GK+DeFySPhI8A6hkBAtIZxmtxpCO/VawpUDH97QqQwGTpXT0wFymRZ9q9tz3XLd3sCaaC10+1q3jm493c60zRSWylxJGQbm4NHrYh9wYHEAWBkMJ55JZjFkg+QGux0bb2DjWxufUxYIgwNBmXINVi5g74C5YzD0lDNp7btzASuLlQB719p353Z5wKzBHPhmLgPMD5ipBnf8B8AHlg9gXYFdl68AOy1WFiuwUeyAucNsXIjFuMUtz3zYN7/ZW9hzafdcAi9Vu/8Nlp24HmC/0dDRht/Ib/x39KO9dNrv5aLPPWYoHocz3bq6lfqY+JgYkDrdYyT7B8hkzOEgmkMGmUQEfDc4pcI3XWA6pTvXMZ0Zc82YZztj4hsTXAV2XHeBqztlSGXfPNNhvEMqmOOP69pPIiF12TbPL+D5JCLTu4fk5CIv1nEGteZiu14mxcmMQF0nZZ4tym1xH6+gSumyTzW30UY9Ksvz5yzd9O3Sh01eJKNDSCYQecR+mRd3A+8vcZb1iFJfYj3K1NseVRVp7z0uivylx6zj6rFHdApvz1OyqfoCqrgvMX6KB9HW7Zr3E/KF6H8k4NoU/y/Nf3Rp4idwfurq/B03UlOl6stOmaovf6BO/U2d35ejj3VejNYEoEfKArCj6W/5owoA/FGuY8DjdAd2JOOBHSY9UMd5D+RR6gP3jexHr8MCgKqGNQBDHZUBDNWtBNF88hU=",
        },
    ],
});
