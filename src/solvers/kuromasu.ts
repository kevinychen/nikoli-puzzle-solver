import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Shaded cells cannot be horizontally or vertically adjacent
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Or(grid.get(p).eq(0), grid.get(q).eq(0)));
    }

    // Numbers cannot be shaded
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0))
    }

    // Clues represent the total number of unshaded cells that can be seen in a straight line
    // vertically or horizontally, including itself
    for (const [p, text] of puzzle.texts) {
        cs.addSightLineCount(puzzle.lattice, puzzle.points, p, p => grid.get(p).eq(0), parseInt(text))
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
    name: "Kuromasu (Kurodoko)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRNb5tAEIbv/hXRnvfApx1zS5O4F9dtaldRhJC1tkmMAt50gaZay/89MwMpLNBDpX7kUC2MhmcH5l3g3fxrKVTMJzDcc25xG4ZreXSOLTxexyop0jg44xdlsZcKEs4/zmb8XqR5PArrqmh01NNA33D9PgiZzThz4LRZxPVNcNQfAr3geglTjNvA5lWRA+l1k97SPGaXFbQtyBd1DukdpNtEbdN4vazIpyDUK86wzzu6G1OWyW8xq3Xg9VZmmwTBRhSwmHyfPNUzebmTj2Vda0cnri8qucsBuW4jF9NKLmYDcnEVLbnzPyB3Gp1O8No/g+B1EKL2L0163qTL4AhxERyZ4+Ot8GXs6tswZ4xg3ADXQuA2wJ90wJgq/BZwEXgNmFJFq8vUQzBpAdLx4xZQZ5PGO4ozig7FFSyBa5fiFUWLok9xTjXXFG8pXlL0KI6pZoIv4Zde01+QEzoeOe51+L//KhqFbFFmm1idLaTKRMrAoyyX6Tov1b3Ywh9HFoafCtiBKg2USvmUJgezLnk4SBUPTiGMdw9D9Rupdp2nP4s0NUC1IRmo8o6BCgXGaF0LpeSzQTJR7A3QMpHxpPhQmAIKYUoUj6LTLWvWfBqx74zO0IUN0P2/Af6jDRA/gfXW/P3W5NDfK9Wg9QEPuB/ooMtr3jM68J6lsWHf1UAHjA20621AfXsD7Dkc2E9Mjk/t+hxVda2OrXpux1Ztw4fR6AU=",
            answer: "m=edit&p=7ZRNb5tAEIbv/Ipoz3sAlg+bW5rGvbhuU6eKImRZ2CYxCnhTPpoKi//emVkcvEAPlfp1qDCzsw/D7ruL3y2+VFEecx8uMeEmt+ASpkO3Z+LvdN0mZRoHF/yyKvcyh4TzD7MZf4jSIjbCtmplHOtpUN/w+l0QMotxZsNtsRWvb4Jj/T6oF7xewiPGLWBzVWRDet2ld/QcsysFLRPyRZtDeg/pNsm3abxeKvIxCOtbznCeN/Q2piyTX2PW6sD+VmabBMEmKmExxT55bp8U1U4+Vew0RcPrSyV3OSJXdHLFq1wxLtfW5c5/g9zpqmlg2z+B4HUQovbPXTrp0mVwbFDXkdkuvgpfxlLfhtkeAq8DwkQgOuD6PeBRhXsGBAKnA1OzN8vUQeCfAVd7BdRZpPGe4oyiTfEWlsBrQfEtRZOiS3FONdcU7yheUXQoelTj4ybANp2P4Q3eXlBUKtQMS9wvEA4SbZ8a4VHjWNS4pmom1Hi2alTPVyWTtlGjTFVviqO8rlWtD7U3Rmg7ZMPT5f763soI2aLKNnF+sZB5FqUMjMsKma6LKn+ItvA3JF9zYgeq1FAq5XOaHPS65PEg83j0EcJ49zhWv5H5rjf6S5SmGijolNKQMpSGyjzR+lGeyxeNZFG518CZs7SR4kOpCygjXWL0FPVmy7o1Nwb7xugOBZyK4v+p+JdORfwE5k+djX/kDPq35NC/V+aj1gc84n6goy5v+cDowAeWxgmHrgY6YmygfW8DGtob4MDhwH5gchy173NU1bc6TjVwO051bvhwZXwH",
        },
    ],
});
