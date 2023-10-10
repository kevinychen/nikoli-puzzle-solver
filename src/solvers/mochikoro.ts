import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form regions of unshaded cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // All regions must be rectangular in shape
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Sum(...vertex.map(p => grid.get(p).eq(1))).neq(1));
    }

    // A number indicates the size of the region that contains it
    for (const [p, text] of puzzle.texts) {
        cs.addContiguousArea(puzzle.lattice, puzzle.points, p, p => grid.get(p).eq(0), parseInt(text));
    }

    // You cannot shade a cell with a number
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // The shaded cells cannot form a 2x2 square
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Or(...vertex.map(p => grid.get(p).eq(0))));
    }

    // All unshaded rectangles form a diagonally contiguous area
    const tree = new ValueMap(puzzle.points, _ => cs.int());
    const root = cs.choice(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(
            Or(
                arith.eq(1),
                root.is(p),
                ...puzzle.points.vertexSharingPoints(p).map(q => And(grid.get(q).eq(0), tree.get(q).lt(tree.get(p))))
            )
        );
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
    name: "Mochikoro",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTBb5s+FMfv+Ssqn33AQAjh1l/X7JJlv66ZqgqhyElogwpxZ2CdiPK/970HGTGwww7bOmkifnl8/LC/Nnydfymljrmw8Of4HP7hcoVPzfY9alZzLZMijYMLflkWO6Uh4fzjbMYfZJrHo7CpikaHahpUN7x6H4RMMM5saIJFvLoJDtWHoFrw6ha6GBfA5nWRDel1m95RP2ZXNRQW5Ismh/Qe0k2iN2m8mtfk/yCslpzhPP/R05iyTH2NWaMD7zcqWycI1rKAxeS75LnpycuteiqbWhEdeXVZy70dkOu0cjGt5WI2IBdX8YvlTqPjEbb9EwheBSFq/9ymfpveBgeIi+DAXA8f9UBL/W7Y2EEAr+oEPBuB24LJuFPhCwR+C4RF5OwZISZdYvunPT4R1+3WuNMu8Wjk75PDKgSt5Z7ijKJNcQlL5ZVD8R1Fi+KY4pxqrineUbyi6FL0qGaCm/VT2/kb5IRO7U3zGv99LBqFbFFm61hfLJTOZMrgxGC5Sld5qR/kBr5/OlDgEwe2p0oDpUo9p8nerEse90rHg10I4+3jUP1a6W1n9BeZpgaoj0gD1U42UKHBpmf3Umv1YpBMFjsDnFnaGCneF6aAQpoS5ZPszJa1az6O2DdGLXTgOHb+Hcd/6DjGV2C9tVPkrcmhr1fpQesDHnA/0EGXN7xndOA9S+OEfVcDHTA20K63AfXtDbDncGA/MDmO2vU5qupaHafquR2nOjd8GI1eAQ==",
            answer: "m=edit&p=7ZXNbtswDIDveYpCZx0sS5Yd37qu3aXL1rVDURhB4aRua9SJOztZBwd591EkU8eOd9hhf8DgmKQ/URQlhVL9ZZ1WmVSe++lIgobHqAhfP7L4evxc5asii4/k8Xr1WFZgSPnh7Ezep0WdjRL2mo42zThuLmTzLk6EElL48Coxlc1FvGnex81ENpfQJKQCdk5OPpinrXmN7c46Iag8sCdsg3kD5jyv5kV2e07kY5w0V1K4cd5gb2eKRfk1E5yH+56Xi1nuwCxdwWTqx/yZW+r1Xfm0FrshtrI5pnQvB9LVbbr6NV09nK7/69MdT7dbWPZPkPBtnLjcP7dm1JqX8Wbr8toIY11XC7nQ3ohAO+C3wPoOmBaEQc8jUg5ELVCe6vVRKuwTP9qt8Y4Y0/cx4z6xqjM4zELhXG5QnqH0UV7BVGWjUb5F6aEMUJ6jzynKa5QnKA1Kiz6hWyxYzv0Y9qD3BCVlQSPA6grtiRhS1IZURGqMyhA0BA3BgDoEihRBS9AStJZUiCr0SVGwkNpCbqPQIUWJqC0iOKaYY41KeR5rn/WOG9YUUSn+VpY1xVY+9/cVa+a8AEpzPM39NMczPJ4JWHO74XZeDxUw5xVRlvtZjmtd/9c/AG2629DtKNF0inWf4N9j01EiJuvFLKuOJmW1SAsBZ6uoy+K2Xlf36RxOCjx6JbIlenZQUZbPRb7s+uUPy7LKBpsczO4ehvxnZXXXi/6SFkUH1HiZdBCdeR20qvLOd1pV5UuHLNLVYwfsHX6dSNly1U1glXZTTJ/S3miLds7bkfgm8E00XFz6/8X1hy4utwXeT11fv+X4/7vSwX9vWQ2WPuCB6gc6WOXMDwod+EFJuwEPqxroQGED7dc2oMPyBnhQ4cB+UOQuar/OXVb9UndDHVS7G2q/4JPp6Ds=",
        },
    ],
});
