import { range } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded cells must form filled squares
    const maxLength = Math.min(puzzle.height, puzzle.width);
    const squares: Point[][] = [];
    for (let len = 1; len <= maxLength; len++) {
        squares.push(range(len).flatMap(y => range(len).map(x => new Point(y, x))));
    }
    const placements = puzzle.points.placements(squares);
    const sizeGrid = new ValueMap(puzzle.points, _ => cs.int());
    const typeGrid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        cs.add(
            Or(
                And(grid.get(p).eq(0), sizeGrid.get(p).eq(0), typeGrid.get(p).eq(-1)),
                ...placements
                    .get(p)
                    .map(([placement, _, type]) =>
                        And(
                            ...placement.map(p => grid.get(p).eq(1)),
                            ...placement.map(p => sizeGrid.get(p).eq(placement.length)),
                            ...placement.map(p => typeGrid.get(p).eq(type))
                        )
                    )
            )
        );
    }

    // Squares cannot touch
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0), typeGrid.get(p).eq(typeGrid.get(q))));
    }

    // Cells with clues cannot be shaded
    for (const [p] of puzzle.symbols) {
        cs.add(grid.get(p).eq(0));
    }

    // Numbers indicate the sum of the size of all blocks that share a border with the clue
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...puzzle.points.edgeSharingPoints(p).map(q => sizeGrid.get(q))).eq(parseInt(text)));
    }

    // Clues without numbers must be adjacent to at least one block
    for (const [p] of puzzle.symbols) {
        if (!puzzle.texts.has(p)) {
            cs.add(Or(...puzzle.points.edgeSharingPoints(p).map(q => grid.get(q).eq(1))));
        }
    }

    // All unshaded cells form an orthogonally contiguous area
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
    name: "Tasquare",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPbptAEMbvfopoz3swf2wn3NI07sV1mtpVFCFkrW0So4DXXaCpsPzumZklhWXpoZWi5lAhRuMfw+43jL/Nv5dCxXwMl3fOh9yByx2P6XZ8n+5hfS2TIo2DM35ZFjupIOH8ZjrlDyLN40FYV0WDY3URVLe8+hSEzGGcuXA7LOLVbXCsPgfVnFcLeMS4A2ymi1xIr5v0jp5jdqWhM4R8XueQ3kOqpa9mmnwJwmrJGe7zgd7GlGXyR8xqHfh7I7N1gmAtCmgm3yWH+klebuVTWdc60YlXl1ruokeu18jFVMvFrEcudoFyN4napG8j9yI6neCzfwXBqyBE7d+a9LxJF8ER4jw4Mtd97VTPhnkE/BaYdCr8EQKvASMfwagBY1qjBSb0Csz/FzAXBTEOSbp/lQTcGCtzcROLklqb4uoWJd0WJfEWpQ5s2rsuNWfTnlpocEptuhSXMAxeeRQ/UhxSHFGcUc01xTuKVxR9imOqmeA4/2jg7S/9RnJC16XTQ1+jv8+jQcjmZbaO1dlcqkyk8Jdf7MQhZnC2sFymq7xUD2IDTqGjBz42sD29YaBUykOa7M265HEvVdz7CGG8feyrX0u17az+LNLUAHrkBtKeN1ChwNCt30Ip+WyQTBQ7A7TMb6wU7wtTQCFMieJJdHbLmp5PA/aT0R16cHB7/w/uf3Rw4wiG783N700O/Xul6rU+4B73A+11ec0towO3LI0b2q4G2mNsoF1vA7LtDdByOLDfmBxX7focVXWtjltZbset2oYPo8EL",
            answer: "m=edit&p=7ZTfb5swEMff+SsqP/shmF8tb13X7CXL1iVTVaEoIgltUCHODKwTEf/7zmdSMHgPm1RtDxPifPn4fP4a5674VsUioT48ziWdUBse5vv42q6L76R9lmmZJeEFva7KPRfgUPppOqWPcVYkVtRGraxTfRXWd7T+EEbEJpQweG2yovVdeKo/hvWc1guYItQGNlNBDNzbzr3HeendKGhPwJ+3PrgP4BYofT1T5HMY1UtK5D7vcLV0Sc6/J6TVIX9veb5JJdjEJRym2KfHdqaodvy5IuctGlpfK7kLg1ynk+u8ynXMclkrd5uKbfY2cq9WTQOf/QsIXoeR1P61cy87dxGeGqnrRBg7n1TdDXEQuD0QDCJcTwKnA54rgdcBnw1AgEtYD+hJQYyNkh7OkoBr10qYa6KOMRYljyjqHlHPmNc35vWNeQNj3sAQCwec4jEZ2iVcBq0dtO/RTtB6aGcYc4v2Hu0NWhetjzGBvE648H4Of7R6jlZ9YLXDQn5mh4SgjwU4OB4OLlODmnN9HDwFPQU9FempdYGaC1w1yAXqGl/PJ7U3VsQYthT1eH/ur6yIzKt8k4iLORd5nEEdLPbxMSHQcEjBs3VRicd4C+WD/YgiO+AKDWWcH7P0oMelTwcuEuOUhMnuyRS/4WI3yP4SZ5kG1P9AQ6oRaKgUqfY7FoK/aCSPy70Geh1By5QcSl1AGesS4+d4sFvenbmxyA+Cb+RAN3f+d/O/1M3lFUx+q6f3m+mbdZx/Sw7+e7kwlj5gQ/UDNVZ5y0eFDnxU0nLDcVUDNRQ20GFtAxqXN8BRhQP7RZHLrMM6l6qGpS63GlW73Kpf8NHK+gk=",
        },
    ],
});
