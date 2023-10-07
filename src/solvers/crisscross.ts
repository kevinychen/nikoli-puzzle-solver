import { zip } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Fill in all the blank cells with letters from the given words
    const words = [...puzzle.texts].filter(([p]) => !puzzle.points.has(p)).map(([_, text]) => text);
    const allLetters = [...new Set(words.flatMap(word => [...word]))];
    const good = (p: Point) => puzzle.points.has(p) && !puzzle.shaded.has(p);
    const grid = new ValueMap([...puzzle.points].filter(good), _ => cs.enum(allLetters));

    // Find all lines in the grid for words
    const lines = [];
    for (const [p] of grid) {
        for (const v of [Vector.E, Vector.S]) {
            if (good(p.translate(v)) && !good(p.translate(v.negate()))) {
                lines.push(puzzle.points.sightLine(p, v, good));
            }
        }
    }

    // Each line is occupied by a distinct given word (of the same length)
    const wordLocations = words.map(_ => cs.int());
    for (const [i, line] of lines.entries()) {
        const choices = [];
        for (const [word, wordLocation] of zip(words, wordLocations)) {
            if (word.length === line.length) {
                choices.push(And(wordLocation.eq(i), ...zip([...word], line).map(([c, p]) => grid.get(p).is(c))));
            }
        }
        cs.add(Or(...choices));
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value !== -1) {
            solution.texts.set(p, allLetters[value]);
        }
    }
};

solverRegistry.push({
    name: "Criss Cross (Nansuke)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRbb5tMEIbv/Suivd5P4uAD3js3tT9Vcu3GUKEIWRa2SYwC3nSBpsLyf8/MQMuxUm/a5qJCjIeHYefd9b6bfMl8FfAh1w1uWlzjOl5TjQ+nwKwJ3Vp5OWEaBeKGz7L0JBUknK8XC/7gR0kw8DSO32vbwSWfivyO5/8Lj+mMMwNunW15ficu+UeRr3huwyvGdWDLosiAdF6klga5SwVIbwuqI11BbhXf3UN6CNUhCnbLgnwSXu5who3e0deYslh+DVgpBJ8PMt6HCPZ+CrNJTuFz+SbJjvIpK2v17ZXns0Kv3aPXrPRiWsjFrC23nNtvljvdXq+w7hsQvBMeav9cpVaV2uLCzBETOuQryEcaDjCzQRKHlYVhRxYSZ12R8RjJejND4SWbDJHZztqtmGUQc2dOxaY0vvNhWWfUwZ3bNaZr1MRdb+bfISjUxQXiPcUFRYOiA5PhuUnxPUWN4ojikmrmFF2KtxSHFMdUM8Hl+MUFK5bqD8jxdKuwHx/9+DVqT//BphrACmfqwT8EsA1WWbwP1M1KqtiPGBiPJTLaJeV7Qb6EjQLsTJUNFEn5HIXnZl34eJYq6H2FMDg+9tXvpTq2Rn/xo6gBioOmgQo/NFCqYLPXnn2l5EuDxH56aoCaMRojBee0KSD1mxL9J7/VLa7mfB2wb4xuz4RTzfx3qv2tUw3/A+2tWfWtyaHtK1Wv9wH32B9or81L3nE68I6nsWHX1kB7nA20bW5AXX8D7Fgc2E9cjqO2jY6q2l7HVh27Y6u6473t4BU=",
            answer: "m=edit&p=7ZTJjptAEIbvPMWozx2JBi+YmzOxo5GIyRgiK0KWhW1mBg02E5ZMhMW7p6ogplki5ZLlEFmUi49e/i74K/2S+0nAR1xoXDe4ygX+ZiofzYAZU7rU+ueGWRSYN3yeZ09xAgnn9nLJH/woDRRP5Thf3SqXYmYW97x4b3pMMM40uATb8uLevBQfzGLFCwceMS6AWdUgDdJFlRoq5BsagPS2ogLpCnKjmvcZ0kOYHKJgZ1Xko+kVLme40VuajSk7xV8DVgvB+0N82ocI9n4Gp0mfwpf6SZof4+e8Hiu2JS/mlV5nQK/e6NWvcvUBufXZfrPc2bYsoe5rELwzPdT+qUmNJnXMC9PHzBQlqruwsYoLzB2QxKGysOzYQOLaDZlMkNjrudWw6QiZ49qbhhkasc3cbdiM1nfvLJnRDpuFIzGh0iYbe734AUGhMC8llg7jkqJG0YXD8EKn+I6iSnFM0aIxC4obircURxQnNGaK5YCCyWtMerOxQoLUQoG06iNmYkZHaoBGZ7QlIOgsEph0wbQ7hXZZS4B2WTRAp4rPJTDpgmlH6UjrKB3pCO4kQItaEhi3plzfQVVfR3of1TvA+paKJ4yqb/Dx9V+T7t6AGxSQlicP/iGA73eVn/ZBcrOKk5MfMegYLI2jXVo/N6mhcGJnGtlCURy/ROG5PS58PMdJMPgIYXB8HBq/j5NjZ/VXP4paIKUO2UKVkVsoS8LWvZ8k8WuLnPzsqQUkR7dWCs5ZW0DmtyX6z35nt1Nz5lJh3xhdng7tWP/fjv9WO8Z3oP5iU66azR9pef+WHPp842TQ+4AH7A900OY17zkdeM/TuGHf1kAHnA20a25AfX8D7Fkc2E9cjqt2jY6qul7HrXp2x61kx3tb5Ts=",
        },
    ],
});
