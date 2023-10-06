import { Constraints, Context, PointSet, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form islands
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // All regions contain exactly one island, which is an orthogonally connected group of shaded cells
    const regions = puzzle.regions();
    for (const region of regions) {
        cs.addAllConnected(new PointSet(puzzle.lattice, region), p => grid.get(p).eq(1));
        cs.add(Or(...region.map(p => grid.get(p).eq(1))));
    }

    // A number indicates the size of the island in the region
    const regionAreas = new Map(regions.map(region => [region, cs.int()]));
    for (const [region, arith] of regionAreas) {
        cs.add(arith.eq(Sum(...region.map(q => grid.get(q)))));
    }
    for (const [p, text] of puzzle.texts) {
        cs.add(regionAreas.get(regions.get(p)).eq(parseInt(text)));
    }

    // Shaded cells cannot be adjacent across region borders
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
        }
    }

    // Two regions which share a border must have islands of different sizes
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(regionAreas.get(regions.get(p)).neq(regionAreas.get(regions.get(q))));
        }
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
    name: "Shimaguni (Islands)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPT9tMEL3nr0B73kPWu96Ab5TCd+FLS0mFkGUhJxiIcGLqOKVylP+dN+MNziauqraqyqGyPHp+frM7++PN4ssyLTNp8ehD2ZcKT2Atv8oYfvvuGU2rPIsO5PGyeihKACk/nJ3JuzRfZL3YqZLeqj6K6gtZ/xfFQgkpArxKJLK+iFb1/1E9lPUlfgmpwJ03ogDwtIVX/J/QSUOqPvDQYcBrwMm0nOTZzXnDfIzieiQFzfOOswmKWfE1E64O+p4Us/GUiHFaYTGLh+mT+7NY3haPS6dVyVrWx025lx3l6rZcgk25hDrKpVX84XKPkvUa2/4JBd9EMdX+uYWHLbyMVojDaCVCTak4GdWcjQgNEXaLCD0F8hRnX3M84xhwHGFwWWuO7zn2OYYcz1lzijmV0lIFmDjAiEHgYx00WOMCbrDC9QtQF2uAtcMGGuM0BrnGjWMwvnEazVe3zQ2wHMYhsHUYVzwYtHrtNBoa7TQaGu00bAenMdAYpzHQhA6HwNZhC80rRq51uSHhzVqAae839dPBsAbYOmyBB5s1Yr2hW3sIbB22wAPC2Owr3vITjoaj5aMY0C34qXvy+6f+w3JiOv3XBzv2qzjpxeL09j47GBblLM3hk+FyNs7KzTcak1gU+c1iWd6lE9iM+xacBG7OSo/Ki+Ipn8593fR+XpRZ5y8iM0zfoR8X5e3O6M9pnntE04c9qmkYHlWV6AZb32lZFs8eM0urB4/Y6hzeSNm88guoUr/E9DHdmW3WrnndE98Ev7FG19f/uv5f6vp0BP235um3Vg7f3qLstD7oDveD7XS54/eMDn7P0jThvqvBdhgb7K63Qe3bG+Sew8F9x+Q06q7Pqapdq9NUe26nqbYNHye9Fw==",
            answer: "m=edit&p=7VVNb9swDL3nVxQ66xB9uvWt69pdumxdOwyFERRO6rZGnbiznXVw4P8+UmLjKPGAfWDYDoNh6fnpkaIsUqo/r9Iq4xYedcjHXMAjrXWv0Nq9Y3qu8qbI4gN+vGoeygoA5+/OzvhdWtTZKCHVdLRuj+L2grdv4oQJxpmEV7Apby/idfs2bie8vYQhxgVw514kAZ728JMbR3TiSTEGPCEM8BrgPK/mRXZz7pn3cdJecYbzvHLWCNmi/JIxigO/5+ViliMxSxtYTP2QP9FIvbotH1fsZYqOt8c+3MuBcFUfrtqEq4bDlX8+3KNp18Fv/wAB38QJxv6xh4c9vIzXHca1ZkahKeyM8HvDjEbCbhEmUICdcNbXrj1zrXTtFTjnrXLta9eOXWtce+40pzCnEIoLCRNL8ChliJX0WIkeC0g/qUkDWBHWoNGk0WCryY9WmK7kR/cYbaUhbABbwpDiMur1ijQKNIo0CjSKNK4cSKNBo0mjQWMIG8CWsDVbGGwt2RrEuvdpdB+/obUYwJawBRypfr2G1m4AW8IWcIS4w3TEX37iWu1a67YiwiyAPNneKhtukk+PzWb7jYS0YRJ8Qybgr8Mucp1SvjOu0/4L/zp2Xqm90nhz45XGk9YbWE9aT0aejLx5hOQm63ym4fK6UYJZs3nMr+PpKGGnt/fZwaSsFmkB9TVZLWZZ9fINBxqry+KmXlV36RzK05133HFLpwyooiyfinwZ6vL7ZVllg0NIZjD9gH5WVrc73p/TogiI2p3fAeUPmoBqqjz4TquqfA6YRdo8BMTWiRN4ypZNGECThiGmj+nObIt+zd2IfWXuTRTcFur/bfGXbgvcgvFP3Rm/fwP8wNH0b4XjsresBksf6IHqB3awyonfK3Tg90oaJ9yvamAHChvY3doGar+8gdyrcOC+U+TodbfOMardUsep9qodp9ou+GQ6+gY=",
        },
    ],
});
