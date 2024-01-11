import { Constraints, Context, FullNetwork, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines through the center of cells to fill each empty cell with a loop
    const network = new FullNetwork(puzzle.lattice);
    const grid = cs.NetworkGrid(puzzle.points, network);
    for (const [_, arith] of grid) {
        cs.add(Or(arith.isLoopSegment(), arith.isStraight()));
    }

    // Loops must be rectangular
    const edges = puzzle.points.edges().map(([p, _, v]) => [p, v] as [typeof p, typeof v]);
    const loopDirection = new ValueMap(edges, _ => cs.int(0, 1));
    for (const [p, q, v] of puzzle.points.edges()) {
        cs.add(Or(loopDirection.get([p, v]).eq(1), loopDirection.get([q, v.negate()]).eq(1)));
        cs.add(
            Or(
                Not(grid.get(p).hasDirection(v)),
                loopDirection.get([p, v]).eq(0),
                ...puzzle.points
                    .edgeSharingNeighbors(q)
                    .filter(([_, w]) => v.dotProduct(w) === 0 && v.crossProduct(w) > 0)
                    .map(([_, w]) =>
                        And(grid.get(q).isLoopSegment(), grid.get(q).hasDirection(w), loopDirection.get([q, w]).eq(1))
                    ),
                And(grid.get(q).isStraight(), grid.get(q).hasDirection(v), loopDirection.get([q, v])?.eq(1) || false)
            )
        );
    }

    // Loops cannot go through shaded cells
    for (const [p, arith] of grid) {
        cs.add(arith.eq(0).eq(puzzle.shaded.has(p)));
    }

    const model = await cs.solve(grid);

    // Fill in solved loop
    for (const [p, arith] of grid) {
        for (const v of network.directionSets(p)[model.get(arith)]) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Ring Ring",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRdb5swFH3nV0x+9gMfyZb4reuavWTdumSqKoQiJ3EbVIg7A+vkKP+9916YiIFKfVnXh8nhcDi+sQ9wD8XPShrFxzCiCfd5ACMMJ3SMfPz9Gcu0zJR4x8+qcqcNEM6/zmb8VmaF8uKmKvEOdirsFbefRcwCxlkIR8ASbq/EwX4RdsHtAqYYD0Cb10Uh0IuWXtM8svNaDHzglw0HegN0k5pNplbzWvkmYrvkDPf5SP9GynL9S7HGB15vdL5OUVjLEm6m2KUPzUxRbfV91dQGyZHbs+ftRq1dpLVdZAN28S7+st1pcjzCY/8OhlciRu8/Wjpp6UIcWOgzEcBLierTiE6jgE5jnIO6S3EADAhvCGeEIeESFuM2IvxE6BOOCedUc0F4TXhOOCJ8TzUf0M4LDb+anTisex/H+GUs8WK2qMyt3CgGfc8Kna2K5lpQLOBFgbav8rUyjpRp/ZCle7cuvdtrowanUFTbu6H6tTbbzuqPMsscoQ65I9X96EilgWY7uZbG6EdHyWW5c4STxnRWUvvSNVBK16K8l53d8vaejx77zeiII/ioRP8/Kv/oo4KvwH9rSX1rdqh7tRmMPsgD6Qd1MOWN3gs66L1I44b9VIM6EGxQu9kGqR9vEHsJB+2ZkOOq3Zyjq27Ucate2nGr08DHifcE",
            answer: "m=edit&p=7VRNb5tAEL3zK6o9zwF2WRv2lqZxL+5H6lRRhCwL2yRGwSblo6mw+O+ZnQXbGCLl0o9DtWZ4vBlmn5d9m/8owywCiUN4YIODg3OPLtfWv3bcxEUSqXdwURabNEMA8GUygfswySMraKrm1r7yVXUN1UcVMIcB43g5bA7VtdpXn1Q1g2qGKQYOclNTxBFeHeEt5TW6NKRjI/7cYIR3CFdxtkqixdQwX1VQ3QDT87yntzVk2/RnxBod+nmVbpexJpZhgX8m38RPTSYv1+ljydopaqguXpcrjnLFQa4Ylst/v1x/Xte47N9Q8EIFWvv3I/SOcKb2jNtMOfhRhLm5dHMdukmdq7XyPUaH4h3FCUVO8QabQSUofqBoU5QUp1RzRfGW4iVFl+KIasZaDgo+7TFq32Zc7z+mBGgkbIM4CMcg/8Ah8ggJu81q5BuE7/IWueYNgV2EQQLcJou7fGyQD67pp7e96eJykKazOwY5Mshrs9KBkeksRyBNF4l1pov0QDZ1vqk7LMzpApvFm50stllgvXi1FXDjSD3k29DcCtiszO7DVcTQjSxPk0XePCsyKxC3K7fLKOtQSZo+JfGuWxc/7NIsGkxpMlo/DNUv02x91v05TJIOkdPR06GMSzpUkcWd5zDL0ucOsw2LTYc4sUunU7QrugKKsCsxfAzPZtse/3NtsV+MrkDgUSf+H3V/6ajTn8B+44H3B4+zf0sO7d40G7Q+0gPuR3bQ5Q3fMzryPUvrCfuuRnbA2Mieexupvr2R7DkcuVdMrrue+1yrOre6nqrndj3VqeGDufUC",
        },
    ],
});
