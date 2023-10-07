import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // The number on a cell indicates how many cells are shaded in a continuous line starting from the cell
    // These lines are in the four cardinal directions (up, down, left, right)
    for (const [p, text] of puzzle.texts) {
        cs.addSightLineCount(puzzle.lattice, puzzle.points, p, q => Or(q.eq(p), grid.get(q).eq(1)), parseInt(text) + 1);
    }

    // You cannot shade a cell with a number
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(0));
    }

    // The shaded cells cannot form a 2x2 square
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Or(...vertex.map(p => grid.get(p).eq(0))));
    }

    // All shaded cells form an orthogonally contiguous area
    cs.addAllConnected(puzzle.points, p => grid.get(p).eq(1));

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Canal View",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZTPb5swFMfv+Ssqn33AkJ/cuq7ZJcvWJVNVIRQ5CW1QIe4MrJOj/O9978EGBnbYYV0Pk+Wnx4eH39fA19m3QuqIT2F4U+5wAcMbujRdZ0bTqcY6zpPIv+CXRX5QGhLOP83n/F4mWTQIqqpwcDIz39xw88EPmGCcuTAFC7m58U/mo2+W3KzgFuMC2KIsciG9rtNbuo/ZVQmFA/myyiG9g3QX610SbRYl+ewHZs0Z9nlHT2PKUvU9YpUOvN6pdBsj2MocNpMd4qfqTlbs1WNR1YrwzM1lKXfVI9er5WJaysWsRy7u4i/LnYXnM7z2LyB44weo/WudTut05Z8gLv0Tcyf46Ai0lN+GeQIBfKqfYDhEMK7B2EPgNcAYwbABZq2KCa3RBNS28cjUaYFZew0h3JZUIajxrxrYkqCN3VGcU3QprmHf3HgU31N0KI4oLqjmmuItxSuKQ4pjqpngm/ujd/sKcgJ3TEatx+h1r8NBwJZFuo30xVLpVCYMbM8ylWyyQt/LHfzEdCrAfwrsSJUWSpR6SuKjXRc/HJWOem8hjPYPffVbpfet1Z9lkligPOUsVNrRQrkGrzWupdbq2SKpzA8WaPjSWik65raAXNoS5aNsdUvrPZ8H7AejGXhwpnr/z9R/dKbiJ3Demvvfmhz6e5XutT7gHvcD7XV5xTtGB96xNDbsuhpoj7GBtr0NqGtvgB2HA/uNyXHVts9RVdvq2KrjdmzVNHwQDl4A",
            answer: "m=edit&p=7VRLb9swDL77VxQ662BZft+6rtkly9YlQ1EYQeAkbmPUjjs/1sGB/3sp0qvjxw47rNthEERSHynxk2yy+FaFecRdGNLlOhcwpGngNHQPp96OVVwmkX/BL6vykOVgcP5pNuP3YVJEWtBGrbVT7fn1Da8/+AETjDMDpmBrXt/4p/qjXy94vQQX4wKwOQUZYF535i36lXVFoNDBXrQ2mHdg7uJ8l0SbOSGf/aBecabyvMPdymRp9j1iLQ+13mXpNlbANizhMsUhfmo9RbXPHiv2M0XD60uiu5ygKzu68pWunKZr/Hm63rpp4Nm/AOGNHyjuXzvT7cylf2oUrxMzHLXVAi70bZgUCjA6wDQVYHeALRUgzwBbAeYZ4A0iHHMIOIMtrj4AvOEZQhgDqkLYvRi4ksCL3aGcoTRQruDevJYo36PUUVoo5xhzjfIW5RVKE6WNMY56OXjb8zPs0e4FSmJBGZbqkYEnUDRcUh4qSStJK1OQMkhJUhYqi3wW+SzyWa2PjrYcVLZJio52yOe0K0rkEujSBpd8Lvk8nRSBQqeEQuitFq2WrTZbrai8Pjs9tXrGRgsMGxtJN6y3Xa+1gC2qdBvlF4ssT8OEQVtiRZZsiiq/D3dQZNi1OGJHjOxBSZY9JfGxHxc/HLM8mnQpMNo/TMVvs3w/OP05TJIeUGAX7kHULnpQmce9dZjn2XMPScPy0APO+kbvpOhY9gmUYZ9i+BgOsqXdnRuN/WA4Awk9X/7v+X+p56tPoP9W53+TZvlv0cG/N8snSx/gieoHdLLKW3xU6ICPSlolHFc1oBOFDeiwtgEalzeAowoH7BdFrk4d1rliNSx1lWpU7SrVecEHa+0F",
        },
    ],
});
