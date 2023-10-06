import { Constraints, Context, Puzzle, Solution } from "../lib";

const solve = async ({ If, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw lines to move some of the circles
    const [network, grid, order] = cs.PathsGrid(puzzle.points);
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.neq(0), Or(arith.isLoopSegment(), order.get(p).eq(0)).neq(puzzle.symbols.has(p))));
    }

    // A circle can be moved horizontally or vertically, but cannot make a turn
    for (const [_, arith] of grid) {
        cs.add(Implies(arith.isLoopSegment(), arith.isStraight()));
    }

    // A number indicates how many spaces the circle must move
    for (const [p, text] of puzzle.texts) {
        if (text === "0") {
            cs.add(grid.get(p).eq(0));
        } else {
            cs.add(order.get(p).eq(parseInt(text)));
        }
    }

    // Each region must have exactly one circle
    for (const region of puzzle.regions()) {
        cs.add(Sum(...region.map(p => If(puzzle.symbols.has(p), grid.get(p).eq(0), grid.get(p).isTerminal()))).eq(1));
    }

    const model = await cs.solve(grid);

    // Fill in solved paths
    for (const [p, arith] of grid) {
        for (const v of network.getDirections(model.get(arith))) {
            solution.lines.set([p, p.translate(v)], true);
        }
    }
};

solverRegistry.push({
    name: "Satogaeri",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VVNb9s4FLz7VwQ88yDq8+OWZp1eUrdZpwgCwQhkR4mNyFYq200hw/89854omPooiha72BwWsqnRaPg4j9Qjt9/2aZnJAJcTSksqXI7l8t+36NdcN6tdnsVn8ny/WxYlgJSfLy/lY5pvs1GiVbPRoYri6lpWH+NEKCGFjb8SM1ldx4fqU1yNZTXFKyEVuKtaZAOOT/CW3xO6qEllAU80BrwDXKzKRZ7dX9XMlzipbqSgcT5wb4JiXXzPhPZBz4tiPV8RMU93SGa7XL3oN9v9Q/G811o1O8rqvLY7HbDrnOwSrO0SGrBLWfzLdqPZ8Yhp/xuG7+OEvH89wfAEp/EB7SQ+CNulrh681GsjbK9JvSECIrB2DeF0CVd1ungWEZZBhB1FYHeIiLsYQSOnRcCuYtN3jWnwrZmsnfdZcttjOYcey4n0WM6mz1JKPZbz6rHhoF9Ouc9S3h0WaV9y8ja3N1hEWTnc/sWtxa3H7RVrxpgm5XhSub6IbUyh60vlIWvCnomh8QyNq3k3AI8cWRNK5Uc19iOpQjgnHBjYhybQGg99fd0XW4lyNe9C72u9Z2JovCY+Np4A68DxsQXRjDJvYA8aX2sIe4Y+1JrQlormknDkAGMNGLvA+FJYb44FHGocIk6k40QmhiZq9PBPK8jYyJ1wqHEYSdvSmsjEFnAdB3dpqya+Db72jDtw7Rl3aLRn5FLzWORbXuoLbl1uff4EAqry39oHzPL6s6/tl3YSGzNvXPju/umn2SgR44en7GxSlOs0xw452a/nWXl6ni7Tl0zgaBLbIr/f7svHdIGNlk8u7KXgNtyjReVF8ZKvNm3d6mlTlNngKyIz2BjQz4vyoRP9Nc3zFlGfwy2q3gxa1K7EeWA8p2VZvLaYdbpbtgjj7GhFyja7toFd2raYPqed0dannI8j8UPwP3Fw7jv/n/v/0blPS2C9t6p/b3b46y3KwdIHPVD9YAerXPO9QgffK2kasF/VYAcKG2y3tkH1yxtkr8LB/aTIKWq3zslVt9RpqF6101BmwSez0Rs=",
            answer: "m=edit&p=7VZNb+M2EL37Vyx0noMokhKp23ab9JKm3TpFsTCMQEm0G2PlKJXtbqHA/71vSCr6LNAWLdpDoZh5enwczpCcoQ4/n4qmpAyPNBSTwCNj5X5pzH/dc7M7VmX+ht6ejo91A0D03eUlfSyqQ7naBNV29dLavH1P7Tf5JhIRRQl+ItpS+z5/ab/N2wtq1+iKSIC78qIE8KKHP7l+Ru88KWLg64ABPwDe75r7qry98sz3+aa9oYjn+cqNZhjt61/KKPjB7/f1/m7HxF1xRDCHx91z6DmcHurPp6ib4kztW+/uesFd2bsrX92Vy+4m/7y7dns+Y9l/gMO3+YZ9/7GHpofr/OXMfr1EieKhGr74vYkS3YXeERkTSU/IKaHEZIiOmYgHhJkosmRC2Hhi1MoRAXeFc/pD5zT40Up6z+dstsTKRdYFMmNdNHPWLLEurhlrFv21i3Zd3BMWYV+64BPX3mATqZWu/dq1sWu1a6+c5gLLJKQmodIoT7CEKiWhM4/1EEOjBxoVeJWBN0FjSKTW49SSMLHH2QCn0GRBozE2DWNRSoQKvII+DXo9xNDozj4KTyaCfZQgXlHHD7CGJhU91gO9CRqTkOC1ZGwlsApYAeugH84FbAI2sGODHTvE0FjRx267dRjEztgEbCwlcdDYIY6BvR38p0R09hPwMvASWAWsoNGvsXj+zOWGt/qda5VrU3cEMs5y1IHhEUm7w4HsIQljkjOGZOpRRonxyFBiHcLpUb5X8o3gkSHpe5UgnXiUEh8mIOx76nXYUe112LfM63BCMs+ZmHipGQkyvhf7ZaRHkjhhJGcIWa/DLlivQ/w29CrijZT+tPt69lomfEasu5LxmjW8ZOfVBmsgBo/++9+2q0108fCpfHNdN/uiQrW+Pu3vyqZ/Xz8Wz2WEazI61NXt4dR8LO5R9N0tSo57ciNGVFXXz9XuaazbfXqqm3Kxi8kSbizo7+rmYWL9S1FVI+LgvglGlC9MI+rY7EbvRdPUX0bMvjg+jojBPTayVD4dxw4ci7GLxediMtu+j/m8in6N3G8j8Q0i//8G+Ze+QXgL4j/1JTK84P/affcHCuJ/yx13eutmMfVBL2Q/2MUsD/ws0cHPUponnGc12IXEBjvNbVDz9AY5y3Bwv5PkbHWa5+zVNNV5qlm281TDhN9sV78B",
        },
    ],
});
