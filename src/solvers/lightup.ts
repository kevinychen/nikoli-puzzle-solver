import { Constraints, Context, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place lights in some empty cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    for (const [p] of puzzle.shaded) {
        cs.add(grid.get(p).eq(0));
    }

    for (const [p, arith] of grid) {
        if (!puzzle.shaded.has(p)) {
            // Lights illuminate the cell they’re in as well as all cells seen in a straight line
            // horizontally or vertically, until obstructed by a black cell
            const visibleCells = [];
            for (const bearing of puzzle.lattice.bearings()) {
                visibleCells.push(...puzzle.points.lineFrom(p, bearing, r => !puzzle.shaded.has(r)).slice(1));
            }

            // Lights may not illuminate each other
            cs.add(Implies(arith.eq(1), And(...visibleCells.map(p => grid.get(p).eq(0)))));

            // Every non-black cell is illuminated
            cs.add(Implies(arith.eq(0), Or(...visibleCells.map(p => grid.get(p).eq(1)))));
        }
    }

    // Clues represent the number of lights in the (up to) four cells surrounding the clue
    for (const [p, text] of puzzle.texts) {
        cs.add(Sum(...puzzle.points.edgeSharingPoints(p).map(p => grid.get(p))).eq(parseInt(text)));
    }

    const model = await cs.solve(grid);

    // Fill in solved lights
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.symbols.set(p, Symbol.LIGHT_BULB);
        }
    }
};

solverRegistry.push({
    name: "Light Up (Akari)",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRNb9swDL3nVxQ662DH+dSt65pdsmxdMhSFYARK4jZG7aiT7XZwkP9eknLmKPaAHfbRw6CYpJ8Y8lnSU/atUCbiQxjBiHvchxF4PXoGHv6OYxHnSSQu+GWRb7WBgPNPkwm/V0kWdWSVFXb25ViUN7z8ICTzGWddeHwW8vJG7MuPopzxcg5TjPuATW1SF8LrOryleYyuLOh7EM9s3IPwDsJ1bNZJtJzaQp+FLBecYZ939G8MWaqfI1bxwPe1TlcxAiuVw8dk2/ipmsmKjX4sqlw/PPDy0tKdt9ANaroYWroYtdDFr/jDdMfh4QDL/gUIL4VE7l/rcFSHc7Fn3T4TPmfBmFzPt25onQX71g0862zKsHKBdTZlZMEx1oT6M6iPhSULYJvsrlNtiYfgB0AZuJEVgB0cAHs5f8GubgbV8I4A9PbFHuwd2QnZLtkFfDovA7LvyXpk+2SnlHNN9pbsFdke2QHlDHHxfnF57SL8BTqy2yOlHkf/97+FHcnmhblX6wgO3axIV5G5mGmTqoSBylmmk2VWzQu6BOBYArajTAdKtH5K4p2bFz/stIlapxCMNg9t+SttNmfVX1SSOIC90hzIqs+BcgPSOnlXxugXB0lVvnWAExk6laJd7hLIlUtRPaqzbmn9zYcO+87okQFcocH/K/QfXaG4Bd5bU/pbo0OnV5tW6QPcon5AW1Ve4Q2hA96QNDZsqhrQFmEDeq5tgJryBrChcMB+InKseq5zZHUudWzVUDu2OhW8DDuv",
            answer: "m=edit&p=7VRNj5swEL3zK1Y++8BnCNy2200vadptUq0qhCKSsBu0gLcGuhUR/33HY/JhcKUeumoPlWE8PA8zD5s31fcm4Sn1YThTalILhmO6eE9McR3HKqvzNLyi1029ZxwcSj/NZvQhyavUiPqo2Di0Qdje0fZDGBGLUGLDbZGYtnfhof0YtgvaLmGJUAuwuQyywb09u/e4LrwbCVom+Avpu+B+A3eb8W2erucy0ecwaleUiDrv8G3hkoL9SEnPQzxvWbHJBLBJaviYap899ytVs2NPTR9rxR1tryXdpYauc6brnOg6err229MN4q6Dbf8ChNdhJLh/PbvTs7sMD8T2SGhR4gQ4uZacfDlJ0JPTxJSTDPH7yZGTDJlKMBA5O/HFB0wcEQeOSZ465o7ET3ACgp72ERAVFMC3Bq+IqmoE5jCPANS2wkMnNlrYGVob7Qo+nbYO2vdoTbQe2jnG3KK9R3uD1kU7wRhfbB5s72WOyejtBVrJQlZYHhkRewpsHXFo5bpgrMRfgDi+DnVNLTrRoZ421tNW87WxvqtDp7YODTSxpw0Wm9cZke1i/zgO788/xUZElg1/SLYpSGHRFJuUXy0YL5KcQO8hFcvXVb8eYmuiiJUYqUA5Y895Vqpx2WPJeKpdEmC6e9TFbxjfDbK/JHmuABU2WgWSPUGBap4pzwnn7EVBiqTeK8BFc1AypWWtEqgTlWLylAyqFedv7gzyk+ANh25Cd/vf2P9OYxdHYP5mex80ordsh/8WHfx7GddKH2CN+gHVqrzHR0IHfCRpUXCsakA1wgZ0qG2AxvIGcKRwwH4hcpF1qHPBaih1UWqkdlHqUvBRbLwC",
        },
    ],
});
