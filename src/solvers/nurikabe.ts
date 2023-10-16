import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board to form regions of unshaded cells
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Each region contains exactly one number
    // All shaded cells form an orthogonally contiguous area
    const shadedRoot = cs.choice(puzzle.points);
    cs.addConnected(
        puzzle.points,
        p => Or(puzzle.texts.has(p), shadedRoot.is(p)),
        (p, q) => grid.get(p).eq(grid.get(q))
    );

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

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Nurikabe",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5swGL3zV1Q++8CPsKXcuq7ZJWPrkqmqEIqchDaoEHcG1slR/vd+32cqYmDSdtjWw+Tw9Hj+bD/HflTfGqEyHkILptzlHjTfn9IzcfH30pZ5XWTRGb9o6p1UQDj/NJvxO1FUmZO0Valz0OeRvub6Q5Qwj3Hmw+OxlOvr6KA/RjrmegFdjHugzU2RD/SqozfUj+zSiJ4LPG450Fugm1xtimw1N8rnKNFLznCddzQaKSvl94y1PvB9I8t1jsJa1LCZapc/tj1Vs5UPTVvrpUeuL4zdxYjdoLOL1NhFNmIXd/GH7Z6nxyP87V/A8CpK0PvXjk47uogOgHF0YL6HQ0PwYs6GTaYoBJ0QkjB5EWCcR6NvCWeEPuESJuc6IHxP6BKGhHOquSK8IbwknBC+oZq3aO+3NvAX7CS+yQK28NdY6iQsbsp1ps5iqUpRMEgDq2Sxqhp1JzZwthQWOD7Q9lRpSYWUj0W+t+vy+71U2WgXitn2fqx+LdW2N/uTKApLMNG3JHNLLalWcAVP3oVS8slSSlHvLOHkulozZfvaNlAL26J4EL3Vym7PR4f9YPQkAXxqgv+fmn/0qcEjcF9bXl+bHbq9Uo1GH+SR9IM6mvJWHwQd9EGkccFhqkEdCTao/WyDNIw3iIOEg/aTkOOs/Zyjq37UcalB2nGp08AnqfMM",
            answer: "m=edit&p=7VRNb9swDL37VxQ66+DPNPGt65pdMm9dMhSFEQRK4jZG7aiT7XVw4P8+kkrqyPaA7bCPw6CYop5I8SnSU/GlEirhATRvzG3uQHPdMX2+jb9TW6RlloQX/Koqd1KBw/mH6ZQ/iKxIrPgYtbQO9SSsb3n9LoyZwzhz4XPYkte34aF+H9YRr+cwxbgD2EwHueDetO4dzaN3rUHHBj86+uDeg7tJ1SZLVjONfAzjesEZ1nlD2eiyXH5N2JEHjjcyX6cIrEUJmyl26fNxpqi28qlipxINr6803fkAXa+l673S9Ybpur+f7mTZNPC3fwLCqzBG7p9bd9y68/DQIK8Dcx1MDYCLPhvmjxHwWiAgwD8BkOdQ9j3ZKVmX7AIW57VH9i1Zm2xAdkYxN2TvyF6T9cmOKOYS6cEGztcY9bIjspqFrjDHndgsBIruhDpPjzxHd67uxtT5GvQ16F/qTucFOi8Y6Q7nXveq94fcGyt2tUCwBT/nLa2YRVW+TtRFJFUuMgYSYYXMVkWlHsQGDpwUxAnbU6QBZVI+Z+nejEsf91Ilg1MIJtvHofi1VNvO6i8iywygoPfAgPTVNaBSpcZYKCVfDCQX5c4Azu6wsVKyL00CpTApiifRqZa3e24s9o3RF3vw/nj/35+/9P7gEdi/9Ar9kTfl36JDt1eqQekDPKB+QAdVfsR7Qge8J2ks2Fc1oAPCBrSrbYD68gawp3DAfiByXLWrc2TVlTqW6qkdS50LPl5a3wE=",
        },
        // {
        //     puzzle: "m=edit&p=7Vbdbts2GL33UxAECmwAY0v0v+6ytOlNlv04Q1EYRkBJjEVYEj2KrGsZeY490F6sH0m1lmUvwDBs60Uh6wN19PGcQ4of6ep3wxQn4YyEARkFJCAhXNMJPMDTaOzvz9eD0DmP0L1RYsNijr7DNzI3RVnh78m10ZlUEdpJVVTyKWElybTeVtFgsNvt+utia+o651U/kcUgzuV6QANKB8F0UDZ0V/H+6tj7ajggC83KlKn0qKgMUERokbGUo0oWHPFiq/co4XleAYB0xjQEjtZKpEhUKBUfRMqhWWqJTFnZnimCQbPqFb1BnCUZSmSpmShFuUb8I0t0vkey5Kg0RcwVAg9oJ3TmaCsGmrY3EDaqrPKqPr2PHnZdIVQwywi0WhrQSwVby5Ll+b6PrvMcNbmerjCVRjBUMFXyRAPuxJ1RCRaUtR0b0JOI/vkHhZFKs0XyqekPc2e781ILxUHSk/df0dfwu5UwHqNlwbRIYL5yo4WEgWQ82cDwLbUb5SVDBVMbN5EozlmyQZbKZ1rxtWL7Pvnp9pY8sbzivWWzaFa9Qz2P6mtSv42WOMQEU7hDvCL1L9Gh/jGq70m9gFeYhIDd+aQhNN/4JrXwO5dg0RufGkDz3ifY9++hmQiV5PzxDroA8nO0rB8Itjo/uC62iQv5gePGh32GxRgLC8RMw9quMrFt3lQmlRvT5IarZ1Jfe7uLl+3a5kturbd/2e189fwMs/4r+H2Mltb6b8fm7NhcRAeI99EBj0PbdQ5O/afB46kFRkdgMvw8FQ0wH1tgdgTCwJFM24hjGbaQ4dwikxYycjwt4tCbGbeRiUVg3XxBJvQMmXX80CDoqNPA8bRGRUPH09Kio1FnKujY8bS0qPfzRQsmMXRT+d7FWxepiw8w06QeuvjaxcDFsYt3LueNi+9cvHFx5OLE5Uztt/pbX/M/sLMcTdxB8fI1/pbzT3NWvSVeGPXEEo5hJ8WwYz9WzXOkleFQ+gD5owdHbuv1UC7lNhclpLVAsS4lHAqXXlmQp+tL+bFUaYd9B4fXCeD/SJxAfoc7gbSC7av1zJSSuxMEDqbsBGhtdSdMcL6dGtDs1CLbsI5acRzzcw9/xO5eUkJhMc++nVP/zzllv0Hwte1vX5sdt3ylOpZ+a1UDfKH8Ab1Y5g1+VumAn9W0FTwva0AvVDag3eIG6Ly+ATwrccD+osota7fQraturVups3K3Uu2KX656rvUJ",
        //     answer: "",
        // },
    ],
});
