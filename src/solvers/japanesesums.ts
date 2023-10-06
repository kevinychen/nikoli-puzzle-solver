import { Constraints, Context, PointSet, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place numbers from the given range into some of the cells
    const maximum = parseInt(puzzle.parameters["maximum"]);
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, maximum));

    // A row or column may not contain two identical numbers
    for (const [p, v] of puzzle.entrancePoints()) {
        for (let i = 1; i <= maximum; i++) {
            cs.add(Sum(...puzzle.points.sightLine(p.translate(v), v).map(p => grid.get(p).eq(i))).le(1));
        }
    }

    // Sums on the outside indicate the sums of consecutive digits in that row or column
    const texts = new PointSet(puzzle.lattice, [...puzzle.texts.keys()]);
    for (const [p, v] of puzzle.entrancePoints()) {
        cs.addContiguousBlockSums(
            puzzle.points.sightLine(p.translate(v), v).map(p => grid.get(p)),
            texts
                .sightLine(p, v.negate())
                .map(p => puzzle.texts.get(p))
                .reverse()
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value) {
            solution.texts.set(p, value.toString());
        }
    }
};

solverRegistry.push({
    name: "Japanese Sums",
    parameters: "maximum: 5",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZNb+s2ELz7VwQ680CK+r4Ur2nSS+o2TYogMIxAdpQXI7KVynZTyPB/z+ySjD6somiLojkUsojlaLUzy+WK3v66z+tCpLh0IqRQuHQi+U4C+kl73a52ZZGdiS/73XNVwxDix8tL8ZSX22Iy0/DAPZ8cmjRrrkXzfTbzlCc8H7fy5qK5zg7ND1kzFc0NHnlCAbsyTj7MC2MmEvYdOxB6blBF6NTaMO9hLlf1siwergzyUzZrboVHRN/y22R66+q3wrNCaL6s1osVAYt8h2y2z6tX+2S7f6xe9tZXzY+i+WL03ozo1a1eMo1cskbkUhb/stx0fjxi3X+G4IdsRtp/ac2kNW+yA8ZpdvC0ole/gRZTHE/7AyAIhkA4BKIhEBMQtUDIQMcjTAhIOkBKQNACkRzEiFipkh2Eo4YdgKN2aCKO2vFIOLu0BVJOJm4BJYdaleSwnSjKZ3Hdt3xW15GrtB6+pXklPxBUQHEd7nm85NHn8RZlEo3m8TseJY8hj1fsc4HqqSQSKkWS6FEPhvAVEqQJDOH7SI6fJLHwJTTzEynhBnHGTcMN9TNuCdyQiHFTcINi4xbADQtj3MAjHY8Ej7I8MOCG1TJywCMdjwSPsjww4PahGjzS8UjwKMsDQ/jaqlYpeKTjkeBRlgcG3KxqlYJHOh4JHmV5YMDNqtZIW7vkYGBiQ8PAxAaAgYmT49OKunx8Wjen2qfVcdo0tGmnQEOBdgE05eNUB1AdOG0BtIWuPiHWLXRViLA6kVvrCAoipyCCgsgpiKEgdgpiKIidghgKYqeA9kHiFFC1E6eAappaBRo7RLt9AAMTt26otjY1xQ684314zmPAY8T7M6aPzF/6DP3zVvhTObPYHGnmSv6+PZ/MvIvHr8XZtKrXeYnP8HS/XhS1m+Pg87ZV+bDd10/5El9xPhfxoQa2Yc8eVFbVa7na9P1WXzdVXYw+IrAA/Yj/oqofB9Hf8rLsAeaU70HmPOpBuxqHTWee13X11kPW+e65B3QOpl6kYrPrC9jlfYn5Sz5gW7c5Hyfe7x7f5n/F//8q/qt/FVQD+dma+rPJ4e1b1aO9D3ik/YGOtrnFTzod+ElPE+FpWwMd6Wygw+YGdNrfAE9aHNgfdDlFHTY6qRr2OlGdtDtRdTt+Np+8Aw==",
            answer: "m=edit&p=7VZNb9s4FLz7VxQ688BHSiTly6LbTXpJ03aTxaIwjEBJ1MaoHLWy3S4U+L93SOlFEu0Ftl0U7aGQRDyORpzhxyO1+bgrmlLkuLQTUhAu7WR4XOpv2V+Xq21Vzp+Ip7vtXd0gEOLl6al4W1SbcrbQYOBZzh7afN6+Fu3z+SKhRCQKDyVL0b6eP7Qv5u25aC/wKhEE7KwjKYQnXegk4r8DwaPPOpQ8et7HCN8gvFk1N1V5ddYhr+aL9lIkXuj38LUPk3X9qUx6I75+U6+vVx64LrbozeZu9aF/s9nd1u93CUvsRfu083txxK8e/OpHu/q4XfX97ebL/R7j/icMX80X3vtfQ+iG8GL+sPe+HhJN/tPf4KWbnESrCEjTGMhiwMSA9YAZgMxGjMx5wI2A3APpABgZtWGCU5IjJLSajQAXyZg8YrjQu3wA8tAZOwAkY68kXdQKKRl/pSiyS1rHX+l0gmAGKMzDm1CehlKF8hLTJFodyj9CKUOZhfIscE4we+SMoBydRI4mCIQi1VUQCKWy/o2zQknZv5ESNM00DZphmgONmEagpUxLQbNMg45kHQkdypiWgebYDnQk60jokGGaAe3RNXQk60jokGUaXGvJNOhI1pHQIcc0uNbENOhI1pHQoZxpcK171xrd1tw5BKhkXMlQMVwxqLAd5UeU+6P8uLFrlQ5jrTS8aXag4UBzA9r3h12ncJ2ytxTeMp6fDOOW8SwYjI7hsTZwYNiBgQPDDiwcWHZg4cCyAwsHlh34deDYgZ9txw78nOa9A40VonkdIECFxw2zrbs53fvdzq/DZ6FMQ2nC+rR+k8E2NF6/Zrpy+93Hyn7jUn2OWOq3gUcgZJEaAVmfRAy4A8BEbeQmYuQ2apQo1iXS0UekVMxRgaPHSGyGlIm6SDq2Q9odcPKJ1uNW0W0DF6Nto9sq/FTsZwvbHdvd5b49Xs4Wycntu/LJed2siwpHzflufV02XMfhnmzq6mqza94WNzipwtkvAnYfmBOoqusP1ep+ylu9u6+b8ugrD5aQP8K/rpvbqPXPRVVNgE34k5lA3Zk7gbbNalIvmqb+PEHWxfZuAowO30lL5f12amBbTC0W74tIbT30eT9L/knC0/07/fpz+lF/Tn4O5Ff9P/3/M/w/7KM/l52wfOvmaO4DPpL+QI+meY8fZDrwg5z2godpDfRIZgONkxvQYX4DPEhxYP+S5b7VONG9qzjXvdRBunupccYvlrMv",
        },
    ],
});
