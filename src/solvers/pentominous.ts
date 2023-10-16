import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Implies, Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into pentominoes (regions of 5 cells)
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Find all placements
    const placements = puzzle.points.placements(puzzle.lattice.polyominoes(5));
    const typeGrid = new ValueMap(puzzle.points, _ => cs.int());
    for (const [p] of grid) {
        cs.add(
            Or(
                ...placements
                    .get(p)
                    .map(([placement, instance, type]) =>
                        And(...placement.map(p => And(grid.get(p).eq(instance), typeGrid.get(p).eq(type))))
                    )
            )
        );
    }

    // Two adjacent pentominoes cannot have the same shape, counting rotations and reflections as the same
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Implies(typeGrid.get(p).neq(typeGrid.get(q)), grid.get(p).neq(grid.get(q))));
    }

    // A letter indicates the shape of the pentomino it's contained in
    for (const [p, text] of puzzle.texts) {
        cs.add(Or(grid.get(p)?.eq("ILYNPUVTWFZX".indexOf(text)) || true));
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
    name: "Pentominous",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VTPb5swGL3zV1Q++8CPpEu5dVmzS8bWJVPVIRQ5CW1QIe4MrJOj/O/9vs9UxMCk7bCth8nh6fH82X6O/Si/1UKlfAwtmHCXe9B8f0LPyMXfS1tmVZ6GZ/yyrnZSAeH842zG70Repk7cVCXOQV+E+prr92HMPMaZD4/HEq6vw4P+EOqI6wV0Me6BNjdFPtCrlt5QP7KpET0XeNRwoLdAN5na5OlqbpRPYayXnOE6b2k0UlbI7ylrfOD7RhbrDIW1qGAz5S57bHrKeisf6qbWS45cXxq7iwG7QWsXqbGLbMAu7uIP271Ijkf42z+D4VUYo/cvLZ20dBEeAKPwwHwXh6IXczbMH3WE8TkKX18EGOfR6FvCGaFPuITJuQ4I3xG6hGPCOdVcEd4QTglHhOdU8wbt/dYG/oKd2DdZwDb+NZY4MYvqYp2qs0iqQuQM0sBKma/KWt2JDZwthQWOD7Q9VVpSLuVjnu3tuux+L1U62IViur0fql9Lte3M/iTy3BJM9C3J3FJLqhRcwZN3oZR8spRCVDtLOLmu1kzpvrINVMK2KB5EZ7Wi3fPRYT8YPXEAn5rg/6fmH31q8Ajc15bX12aHbq9Ug9EHeSD9oA6mvNF7QQe9F2lcsJ9qUAeCDWo32yD14w1iL+Gg/STkOGs35+iqG3Vcqpd2XOo08HHiPAM=",
            answer: "m=edit&p=7VRNc5swEL3zKzI664Ak27G5pUnci+s2tTuZlPF4sE1iJmClApoOHv57VisIFtCZ9NCPQwezfjztrh5CT+m3PFAhHcIlxtSlDC7Ox3gPXP2rr2WUxaF3Ri/ybC8VAEo/Tqf0PojT0PGrrJVzLCZecUOL955PGKGEw83IihY33rH44BVzWixgiFAG3MwkcYDXDbzFcY0uDclcwPMKA7wDuI3UNg7XM8N88vxiSYme5x1Wa0gS+T0klQ79vJXJJtLEJsjgZdJ99FSNpPlOPuaknqKkxYWRu+iRKxq54lWu6JfLf7/cyaosYdk/g+C152vtXxo4buDCO5Za15FwV5dqLebbED5oEcORJr7WBNQxrL7DOMXIMS6hOS0ExiuMLsYhxhnmXGO8xXiJcYBxhDnnWh68wGmPkV1NmAsb0+XEE5RMRAMHAAVC+Ac8qDBkM9dgBpuasQprnlc5UMvESc7EYA6Y1/m8wRxqeVXLRIP5OeBxxU8ajH3qntBHVH0E9BF1LeQLnW8+zOsymyVcnCy5WWa9hKXjc+NTfQ3fhlaOT+Z5sgnV2VyqJIgJOJWkMl6nuboPtrDv0MgUuQNmWlQs5VMcHey86OEgVdg7pMlw99CXv5Fq1+r+HMSxRaR4LFmUcZBFZSqyngOl5LPFJEG2t4gTK1mdwkNmC8gCW2LwGLRmS5p3Lh3yg+DtCzgGxf9j8C8dg/oTuL90GP6Ro+3fkoO7V6pe6wPd435ge11e8R2jA9+xtJ6w62pge4wNbNvbQHXtDWTH4cD9xOS6a9vnWlXb6nqqjtv1VKeG91fOCw==",
        },
        // {
        //     puzzle: "m=edit&p=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",
        //     answer: "",
        // },
    ],
});
