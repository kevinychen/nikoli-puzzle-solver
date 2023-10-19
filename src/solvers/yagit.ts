import { range } from "lodash";
import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ Iff, Implies, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Divide the grid into regions
    // The border lines of the regions start and end on the edges of the grid
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    cs.add([...grid.values()][0].eq(0));

    const isRoot = new ValueMap(puzzle.points, _ => cs.int(0, 1));
    const instance = cs.addConnected(
        puzzle.points,
        p => isRoot.get(p).eq(1),
        (p, q) => grid.get(p).eq(grid.get(q))
    );
    for (const [p, q] of puzzle.points.edges()) {
        cs.add(Iff(grid.get(p).eq(grid.get(q)), instance.get(p).eq(instance.get(q))));
    }

    // Each region must contain either goats or wolves (but not both)
    for (const [p, symbol1] of puzzle.symbols) {
        for (const [q, symbol2] of puzzle.symbols) {
            if (!symbol1.eq(symbol2)) {
                cs.add(instance.get(p).neq(instance.get(q)));
            }
        }
    }

    // Regions must not be empty
    for (const [p, arith] of isRoot) {
        cs.add(Implies(arith.eq(1), puzzle.symbols.has(p)));
    }

    for (const vertex of puzzle.points.vertices()) {
        const lines = range(vertex.length).map(i => grid.get(vertex[i]).neq(grid.get(vertex[(i + 1) % vertex.length])));

        if (puzzle.junctionSymbols.has(new ValueSet(vertex))) {
            // Lines can cross each other except at black dots
            cs.add(Sum(...lines).le(2));
        } else {
            // Lines can only turn at black dots
            cs.add(...range(lines.length / 2).map(i => lines[i].eq(lines[i + lines.length / 2])));
        }
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
    name: "Yagit",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZVBb5tKEIDv/hXVnlppD+xiEodbmqa9JGlTUkURQtbaITEKNukaNxWW/3tmBlxYmEjVq6J3aIUZjT/Gs4MXf15/3xibygAOfyI9qeDQekLn2MPX/rjKyjwN38jjTbkoLCRSfr6QdyZfp6O4KUpG2+oorC5l9SmMhRJSaDiVSGR1GW6r87C6kVUEl4RUwM7qIg3paZte03XMTmqoPMgvmhzSG0jnmZ3n6TSKavQljKsrKXCh9/RxTMWy+JGKZhB8Py+WswzBzJRwM+tF9thcWW9ui4dNU6uSnayO63kjZl6/nRfTel7MmHnxNjrznr3CuEfJbgff+1cYeBrGOPu3Np20aRRuIV5QVBRvwq3QHrRR0JIehOk5DSi0qmkzdkN9nvocHbN9x5qlh2yHI642aPq6tQE7WXDAdmhWc6nycDT9q0XzZAmlcEGO420zXL/QR0947r/Qn77sPodN+0hbpylewc7Kyqf4gaJHMaB4RjWnFK8pnlAcUzygmkN8Nv7z0/NK48S6FhEewe9lySgW0cI8pgIcJNZFPl1v7J2Zww+KFAXbDWy1Wc5S66C8KB7zbOXWZferwqbsJYTp7T1XPyvsba/7k8lzB9QPnYPqDXZQaeF333lvrC2eHLI05cIBHUc4ndJV6Q5QGndE82B6qy3be96NxE9BZ+yD4P1/gv+/BI97oP5M88Lez8xbT+ogwH/6d7h7IJk9ri8QRvdwGJTHYFQ90xtdz2HQL9cEbM9Uo+6ZavQ9h0H4XJPOkh1Mym+77CkKn6HOve8pyp6hoPohRdEz1LkTon+H5GtLF5YVNWDG1UBZJzd8oGXgAwHjgkMHA2U0DLRvYkBDGQMc+BjYC0rGrn0r41R9MeNSAzfjUl09x8noGQ==",
            answer: "m=edit&p=7ZZRb5swEMff8ykmP22SH7ANTeCt67q9tN06MlUViiKS0gaVhI4k60SU7767w5QAF2naVO1lIlj//Hz8fbHNOevv27hIpAeXGUlHKri0HtHtOvipr3G6yZLgjTzdbhZ5AULKz1fyPs7WySCyQZPBrvSD8lqWn4JIKCGFhluJiSyvg115GZS3sgyhS0gF7KIK0iDPG3lD/ajOKqgc0FdWg7wFOU+LeZZMw7BCX4KoHEuBA72nx1GKZf4jETYR/D7Pl7MUwSzewI9ZL9In27Pe3uWPW1GPsZflaZVvyORrmnzNS76Gz1e38714hXT9yX4P8/4VEp4GEeb+rZGjRobBbo95YauovQ12Qjtgo8CSNsL0khIUWlXUpm2p4anhqMv6upqlQ9bB52I9h4v12My8E9ZhyFHlYGpadnaWUMo5wg3P9REfPeK5OeJPk93lsGgfaek0tWNYWVkaaj9Q61DrUXtBMefU3lB7Rq1L7QnFDHFvwO459DhpPy18DVsasjFS+EbSRKF0QRqS0CtpngzNF2hluW60whhtuWm0whjro5C7Vo9A+1b7Ummn8am1hrG0anxqrTHG+mvk1l8PJa0DafDX/oFPrWEs4zQ+Lxo5Ptt5iaoZD+sX6mVVcMb3g0hXNRUv7/fUZBCJcBE/JQLKqVjn2XS9Le7jOdQGqraS2Gq7nCVFC2V5/pSlq3Zc+rDKi4TtQpjcPXDxs7y467g/x1nWAtX700LVXm2hTZG2vsdFkT+3yDLeLFrgoNy1nJLVpp3AJm6nGD/GndGWzW/eD8RPQXdk4Kwy/8+qf3VW4RqovzuxRPEwi986Unse/ml5J6ojq8ZVB2FzBBsWu7w3HlscHvImPhvtOWy0xyeIZxdnMmQxFeXGpabKYanhqGYdsFr2qWF921NN9NXOqz/bO6+VDtWavGALNWCmVgNla7LlvbIMvFeAccB+DQbKlGGg3UoMqF+MAfbqMbAjJRldu1UZs+oWZhyqV5txqMPyHE0GvwA=",
        },
    ],
});
