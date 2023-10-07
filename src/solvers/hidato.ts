import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    // Numbers must be between 1 and N, where N is the size of the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(1, [...puzzle.points].length));

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Consecutive numbers connect horizontally, vertically, or diagonally
    cs.add(Or(...Array.from(grid.values(), arith => arith.eq(1))));
    for (const [p, arith] of grid) {
        cs.add(
            Or(arith.eq(grid.size()), ...puzzle.points.vertexSharingPoints(p).map(q => grid.get(q).eq(arith.add(1))))
        );
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        if (!puzzle.texts.has(p)) {
            solution.texts.set(p, model.get(arith).toString());
        }
    }
};

solverRegistry.push({
    name: "Hidato",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRBb5tMEIbv/hXVnjcSCxgwtzSNe3H9faldRRFCFrZJjIK96QJNheX/nplZWlhDDj20zaFCjIaHYfbdXd4tvlaJSnkAlxNwiwu4HNem27YmdFvNtczKPA3f8cuq3EkFCef/Taf8PsmLdBQ1VfHoWE/C+obXH8OICcaZDbdgMa9vwmP9KaznvF7AK8YFsJkusiG9btNbeo/ZlYbCgnze5JDeQbrJ1CZPVzNN/g+jeskZjvOevsaU7eW3lDU68Hkj9+sMwTopYTLFLntq3hTVVj5WTa2IT7y+1HIXA3KdVi6mWi5mA3JxFr9Z7iQ+nWDZP4PgVRih9i9tGrTpIjxCnIdHZvv4qeOAGL05zA6IjFviWkhst0MEEdjQH2TsEMEpN8TTxOuQMcnsjOV5SKB/S0iP6PTxXerjdwgpnLQgIIGdbyYaBC0RFsnpdBGCBv85T1gQQctyR3FK0aa4hFXjtUPxA0WL4pjijGquKd5SvKLoUvSoxsd1/6Wd+QNyItvjNhk9oGhmgvuv5EaVPikE9rmAeOEH8SgC77NC5quiUvfJBv5kOhrgZwV2qPbrVBkol/Ipzw5mXfZwkCodfIUw3T4M1a+l2p51f07y3AD6qDOQ9qSBSgWG6zwnSslng+yTcmeAjjmNTumhNAWUiSkxeUzORtu3cz6N2HdGd+TAwer8O1j/0sGKW2C9NRO/NTn090o1aH3AA+4HOujyhveMDrxnaRyw72qgA8YGeu5tQH17A+w5HNgrJseu5z5HVedWx6F6bsehuoaP4tEL",
            answer: "m=edit&p=7ZVNb9swDIbv+RWDzipgSf6+dV27S9etS4aiMILCSd3WqBN3trMODvLfS1FuRMfuYYd9HIbABPNYIl+Jolx/36RVxkP4qZA7XMBPuRIf6UT4ON1vljdFFr/jx5vmoazA4fzz2Rm/S4s6myTdqPlk20Zxe8nbj3HCBONMwiPYnLeX8bb9FLcXvJ3CK8YFsHMzSIJ7at0rfK+9EwOFA/5F54N7De4yr5ZFdnNuyJc4aWec6TzvcbZ22ar8kbFOh/6/LFeLXINF2sBi6of8qXtTb27Lxw17TbHj7bGROx2Rq6xctZerxuXK3y83mu92sO1fQfBNnGjt36wbWncab3da15bJQE9VCsSY4jAZIvEscR1NpEuIQCIt8RQSYYlviE+IhzJJLt/XBOJbgnoEiRO4GCcgBBVGFoTOa7k6EBkQWiIclEOiCIHJ9+uEDRG4Lddoz9BKtDPYNd4qtB/QOmg9tOc45hTtFdoTtC5aH8cEet+hMjSGP5iNBUFVCrZWvhYkQuJbonB5KiDEFE0QYma5lrgSSWiJZ+I4hJjCeoTgLKkIwYIIotDDwkLGPfHNLEpMGUmuAGdJoifAtQuiOTDHgcQJcF2CxAlx7YJoDs0YsmMRroukioxAC4SDRAQUoWafErNSQgQq3EvenyJzQqbkRJlTpE/IbpJIHyboOzZE2/cED97we6PMJS10nCOwR0E4nyRw7bK6LG7qTXWXLuESwVuZI1tvVous6qGiLJ+KfN0fl9+vyyobfaVhdns/Nn5RVrcH0Z/TouiBGr8yPWSuwx5qqrz3P62q8rlHVmnz0APkXuxFytZNX0CT9iWmj+lBtpVd827CfjJ8EgXfNPX/m/aXvmm6BM4vfdn+yHX+b8nB01tWo60PeKT7gY52eccHjQ580NI64bCrgY40NtDD3gY0bG+Agw4H9kaT66iHfa5VHba6TjXodp2KNjxcoC8=",
        },
    ],
});
