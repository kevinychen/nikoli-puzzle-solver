import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ And, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Each value is the index of the polyomino
    // -1 represents an unshaded cell
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Place a tetromino (a block of 4 cells) in every outlined region
    const placements = puzzle.points.placements(puzzle.lattice.polyominoes(4));
    const regions = puzzle.regions();
    for (const region of regions) {
        cs.add(
            Or(
                ...region
                    .flatMap(p => placements.get(p))
                    .filter(([placement]) => placement.every(p => regions.get(p) === region))
                    .map(([placement, i]) => {
                        const placementSet = new ValueSet(placement);
                        return And(...region.map(p => grid.get(p).eq(placementSet.has(p) ? i : -1)));
                    })
            )
        );
    }

    // There can not be a 2x2 square of cells occupied by tetrominoes
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Or(...vertex.map(p => grid.get(p).eq(-1))));
    }

    // Two identical tetrominoes cannot share an edge
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Or(grid.get(p).eq(-1), grid.get(p).neq(grid.get(q))));
        }
    }

    // All tetrominoes form an orthogonally contiguous area
    cs.addAllConnected(puzzle.points, p => grid.get(p).neq(-1));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith) !== -1) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "LITS",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZVPT9tAEMXv+RRoz3vI7tq74BuloRdKS6FCyIqQEwxEODF1klI5ynfnzdrjxImrSpXacqgsj+b3spmZ/TPr+bdlUqTS4jGHsi8VHm2tf1UQ+LdfP1eTRZZGB/J4uXjMCzhSfjo9lfdJNk97cT1q2FuVR1F5IcsPUSyUkELjVWIoy4toVX6MyoEsL/GTkAraWTVIwx3ULsnXfgCpJ5Wq+vDPax/uDdzxpBhn6e1ZpXyO4vJKCkr0zv+bXDHNv6eiLoR4nE9HExJGyQKzmT9Onutf5su7/GlZj1XDtSyPq3ovO+o1m3rJrcolr6NcmsUfLvdouF5j3b+g4Nsoptq/btzDjXsZrWDPvVXe3nh76q329gpDZWm8fe9t39vQ2zM/ZhCthFJGKm1EpBX2VwMMgwEEDIHeAkOgGXDYDAMNCxlCgGWwBBzAIrTbzmMCBhxWEzKEyMMQEFgGnOuQIQRYBothLXBNNN8HHAAQMoQAy2ABjkEhtOZoGtFa0BSqsAaKZ6owU8WTo+VVTTSEVs1/EEBxNMqjHINDHgYNMAwGEDAEgJAhBFgGC3AMDqE3QAvCSR3NlMtxtCVcqMMUmv1xmJxrtpFAcVKAZQgAIQMdioABBsLWUmkPOIHX/hyeeBt4a/35dHTQ/3Ir/LKcWGNVmgcL+bv+sBeLwd1DenCeF9MkE7hsxTzPbufL4j4Z4+bwdzEuB2iz5XSUFi0py/PnbDJrj5s8zPIi7fyJxBTpOsaP8uJuJ/pLkmUtofq2tKTqDmxJiwIX3BYnRZG/tJRpsnhsCVuXYStSOlu0C1gk7RKTp2Qn23Qz53VP/BD+jQ2+ZOb/l+xffcloD/pvrYnfWjn++OZFZ+9D7mh/qJ1tXut7nQ59r6cp4X5bQ+3obKi7zQ1pv78h7rU4tJ90OUXdbXSqarfXKdVeu1Oq7Y6Ph71X",
            answer: "m=edit&p=7ZVLb9swDIDv+RWFzjpE79a3rkt36bp17TAURlA4qdsGdeLOTrbBgf/7SMlMbMcDhgF7HAbDMj+KJimZlMvPm6RIuYVLHfMxF3BJa/0ttPb3uLluFussjY746Wb9lBcgcP7u/Jw/JFmZjuLGajraVidRdcWrN1HMBONMwi3YlFdX0bZ6G1UTXl3DFOMCdBfBSII4aURUf/IGqD0LWjEG+bKRQbwFcb4o5ll6dxE076O4uuEMA73yb6PIlvmXlDWJIM/z5WyBilmyhtWUT4uXZqbc3OfPG0Yhal6dhnyvB/JV+3zVLl01nK78/emeTOsa9v0DJHwXxZj7x714vBevo22NeeEo/Hjrx3M/Sj/egCmvlB9f+3HsR+PHC28zibZMCMWFVCySAr6vBFAECkATaNkChSAJoNiUbJkZAgNgCSwCObDg2rXjKE0AxaoMgYE4BBrBEkBdGwIDYAms6YEzLdea4mBTGAIDYAksgCMQ4FqSN2l6sEtUwB4IWqmAlQpaHG6v2HkD12L3DjgQthVHOAIHcQgkgCJQAJpAAxgCA2AJLIAjcLYNuCEU1OnW7jjVWraTre/jYHFu9xkRBAUFsAQawBBgUWgCiRUiWlslPdTYcViHZ37UfrS+Ph0WOrRCu35tt3J7HRCqGzqDSUgVAmFN40OHhwkPGx7OP1QwUWFOBaUOr+swp8OcDnMmzJng04Q5E3yaYGKDiQ2v22Bpg4kLc7jLYte0oVFxI+pRLKU/usNlfl2ejmI2uX9Mjy7zYplkDI5zVubZXbkpHpI5nE3+tOdet9osZ2nRUWV5/pItVl27xeMqL9LBKVSmEG7AfpYX9z3vX5Ms6yhK//fqqMIp21Gti0WHk6LIv3Y0y2T91FG0jtuOp3S17iawTropJs9JL9pyv+Z6xL4xf8cK/pXq/7/yb/0r8RuM//Af8ydOrX8rHV++eTHY+6AeaH/QDrZ5oz/odNAf9DQGPGxr0A50Nmj7zQ2qw/4G5UGLg+4HXY5e+42OWfV7HUMdtDuGand8PB19Bw==",
        },
        {
            name: "LITS (hex/slicy)",
            puzzle: "m=edit&p=7VbPT+M6EL73r0A5u1Js5/eNx5a9sOyysEIoqlBaAq1IGzZtF5Sq/zvfuHEau3l6p4c4rNJM5/tsz4zHHjuz/I159LjMZRyPFK56I49+xNJzM18XeXLCTjfrWVlBYez7+Tl7zIpVPkjd8WBbx0l9xeqvSepwhzkCL3fGrL5KtvW3pB6x+hpNDuPgLvadBNRRoxJ9qzoQe7ZnuQv9stGh3kGdzqtpkd9f7JkfSVrfMIcc/aNGk+osyj+50wRCeFouJnMiivkyf2vI1eahfN403fh4x+rTfajXPaHKQ6ik7iMlrSdSmsD/F2k83u2Q7Z+I9T5JKexfBzU6qNfJFvJSSa7knZLnSgolb9CV1VLJL0q6SvpKXqg+o2TrCBd7IoidRHCsLIHQ1QA7xgRcA2EDoYG0QOQ3gAcWiLVTCadd4HFtwJMd4AfME0EHyKgBQWQBX8cWcQsEsgExTAfadCxsoMfENMYAOiExAjWAr6cQhhbwdNQBnBpAtpODAQPwNiGYqQFcbUBQaXeAjD2dXiyWAaJmCjyOLXBYeuqms8Np5bogbv2ENgg1iGygl0TATxd4XGfUQ65N0F36drXhx3PbHMCAAUSbNxpjAD0FH6kSOiG+bwGpo1YbSQM1ps0BNrnOmwKx3srCN4HnagMS1gwgtAEfMzVBd+mF3lU+9psBpA4nQGwG8LSfEH5MoBMfIlUm0EmM4NQAvnYa0FbugjY7qn5UBDhIbtVxcqakp2SgjpmQzqsPPtH+M5wUd9+Qe3QjCiYYyoOzIe5I/EPhUCTOfJLDmLqoDmjB5lBDhiAEGgWaYEUy8BgBo0gM9ZcM4+gZD1Jn9PCUn1yW1SIrHFylzqos7leb6jGb4nJQdywuAXDLzWKSVwZVlOUL3RUGOX9allXe20RkDnc9/Sdl9WBZf82KwiBWvzdZZQ7eX3MGta5wh3VwVlXlq8EssvXMICbZGl8Yq9n8xbSUL9dmAOvMDDF7zixvi8OcdwPnzVFvKvEVI/9+p3zsdwpl3v1stf3ZwlGbtqx6Kx50T9GD7S3uhj+qb/BHlUwOj4sZbE89g7VLGtRxVYM8Kmxw/1LbZNUub4rKrnBydVTk5Kpb5+l48A4=",
            answer: "m=edit&p=7VZLb9swDL7nVxQ6q4Befsi3bmt36Z7tMAxBULituwZz6s1JtsJF/vtIynJiJgN22bDD4ETk90miKFqkfF89SoePkkpqeKxR9M8d/lT/XM5XdVUcyZP16r5pQZHyzdmZvCvrZTWZqtnkqfNF9052L4up0EIKA38tZrJ7Vzx1r4ruVHYX0CWkBu48DDKgnvYq0h9pALLPA6sV6K97HdRPoN7M25u6ujoPzNti2l1KgQs9o9moikXzvRK9I4hvmsX1HIl6/lA99uRyfdt8WYtofSO7k+DqxQFX7dZVO3hqD3tq/qinfrbZQLTfg69XxRTd/rBV8616UTxt0CVsNbWfqD2j1lB7CUNlZ6l9Qa2iNqH2nMacFk/CKDgTqReF0TKATEWgOdARGA5MBJaBPOmBThnwcVGrxsDpaMDZHZCk0pl0B9i8B2nOQBJ9yzUDqe2BB9NpNO0NB3GO1xzEgHjFQBK3kGUMuOh1ahmww+YUA3oISMqAigaMGwPrXQyvZiDvt6C9Z2D76nFYjI62DPhhnYyDLIKcg/hKjB8Dp2NEneFg99WbnXWcGmLgGTBD3CwHcQsJhMrEgCQJAzZ6TQcp250zxMBs40bAx6NskjFwKhqwOQMmGkgMB7uv3sRTlWgGbHQndQy4uE6WcxADn3kOYhBzxUASF00zBoboUP6QBxusmVhOnlPrqE2pzGRYr6Ci7ZahdFyAWCELRQoKnHBgHBZySRApiSQLIieB6YfCk8CChMKQyMP0PMzLwzzMCRSB9MGKVr3UqpfBkDZRosWhyIbCijveTKZwjR5rh5erkUZqvGSPHV22oGhQrAztscchNAB64JzRlGMgDHQa6HI4LKcZYNRQPwBPM/RsMhWnt5+ro9dNuyhrAbeyWDb11XLd3pU3cM/QdS2Je1gvrqt2RNVN8xWvnRE5//zQtNXBLiQrWO7A+OumvWXWf5R1PSKW39ZlO54cbswRtWrnI1y2bfNjxCzK1f2IuC5X8LGyvJ9/HVuqHlZjB1bl2MXyS8lWW2z3vJmIR0H/qYUPIvv/k+fvfvJg5NVf/vD5jar1b7lDh7ZpD2Y80AeSHtiDyd3ze/kN/F4m44L7yQzsgXwGlqc0UPtZDeReYgP3i9xGqzy90Sue4bjUXpLjUrt5Pp1NfgI=",
        },
    ],
});
