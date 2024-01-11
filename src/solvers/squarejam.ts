import { range } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Distinct, Not, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines over the dotted lines to divide the grid into square-shaped regions
    const grid = new ValueMap(puzzle.points, _ => cs.int());
    const maxLength = Math.min(puzzle.height, puzzle.width);
    const squares: Point[][] = [];
    for (let len = 1; len <= maxLength; len++) {
        squares.push(range(len).flatMap(y => range(len).map(x => new Point(y, x))));
    }
    const placements = puzzle.points.placements(squares);
    const sizeGrid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        cs.add(
            Or(
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(
                            ...placement.map(p => sizeGrid.get(p).eq(instance + 1)),
                            ...placement.map(p => grid.get(p).eq(type))
                        )
                    )
            )
        );
    }

    // A number indicates the side length of the square it's contained in
    // Squares may have any amount of identical numbers
    for (const [p, text] of puzzle.texts) {
        cs.add(sizeGrid.get(p).eq(parseInt(text)));
    }

    // Region borders must not form 4-way intersections
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Not(Distinct(...vertex.map(v => grid.get(v)))));
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
    name: "Square Jam",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb9owGL3nr6h89iG/gDa3riu7MLYOpqqKImQgLVET3DnJOhnxv/f7PqcKTrLDJm3rYbL89PL8YT9jP5ffaqFSPoYWnHOXe9D88Zi6F4bU3aYtsypPozN+WVc7qYBw/mk65fciL1MnbqoS56AvIn3D9YcoZh7jzIfusYTrm+igP0Z6zvUChhj3QJuZIh/odUtvaRzZlRE9F/i84UDvgG4ytcnT1cwon6NYLznDdd7Rr5GyQn5PWeMDvzeyWGcorEUFmyl32VMzUtZb+Vg3tV5y5PrS2F0M2A1au0iNXWQDdnEXf9juRXI8wt/+BQyvohi9f23peUsX0QFwHh2YP8KfBuDFnA0LJx1h5KMAZ/cqTMLXP4cEmMij6e4Ip4Q+4RJW4zogfE/oEo4IZ1RzTXhLeEUYEo6pZoJ+f2lHf8FO7PsUD9NGv88TJ2bzulin6mwuVSFyBqFhpcxXZa3uxQauAGUKThm0PVVaUi7lU57t7brsYS9VOjiEYrp9GKpfS7XtzP4s8twSzBthSeYyW1Kl4KaefAul5LOlFKLaWcLJrbZmSveVbaAStkXxKDqrFe2ejw77wajHAbxIwf8X6R+9SHgE7ltL8VuzQ7dXqsHogzyQflAHU97ovaCD3os0LthPNagDwQa1m22Q+vEGsZdw0H4Scpy1m3N01Y06LtVLOy51Gvg4cV4A",
            answer: "m=edit&p=7VRNb5tAEL3zK6I978HsspBwS9O4F9dtaldRhCwL2yRGAZMCbios/ntnhsV89tBK/ThUqx09HrMzD3bfZl+OfhpwG4a85BNuwhC2TdO0LJoTPZZhHgXuBb8+5vskBcD5h+mUP/pRFhiezloZp+LKLe548c71mMk4EzBNtuLFnXsq3rvFnBcLeMW4CdysShIAbxt4T+8R3VSkOQE81xjgA8BtmG6jYD2rmI+uVyw5wz5vaDVCFidfA6Z14PM2iTchEhs/h4/J9uGLfpMdd8nzkdUtSl5cV3IXI3JlI1ee5cpxueL3y71alSX89k8geO16qP1zAy8buHBPJeo6MaFwqQQt1d4wy+kRSiAhGsKx6p9DBBQyqdwDxSlFQXEJ3XghKb6lOKGoKM4o55biPcUbihZFm3Ic1Atf1K5hd1czU8BZFaBSgh5TtDCcWmFVWEKO1LwQDZaIpcYSsM4XVoORt3SOhbjmrQaTQ5TGCrCtMbrHqbACDUr3VdBXtWqeMaxVuo5C3KpTY4W4rglrbb3WRqz12KDHbtWpMeY4sslx6nzIcTCnOhfnTa02bNHa4GpTccNKw8NfeR7q1/HK8Nj8GG+C9GKepLEfMbg+WJZE6+yYPvpbMAPdLpy4A2V2qChJXqLw0M0Lnw5JGoy+QjLYPY3lb5J016v+6kdRh8jotuxQla07VJ6GnWc/TZPXDhP7+b5DtPzdqRQc8q6A3O9K9J/9Xre4+ebSYN8YTU/C3Sz/381/6W7GLZj81A39R67Xf0sOnd4kHbU+0CPuB3bU5ZofGB34gaWx4dDVwI4YG9i+t4Ea2hvIgcOB+4HJsWrf56iqb3VsNXA7tmob3lsZ3wE=",
        },
    ],
});
