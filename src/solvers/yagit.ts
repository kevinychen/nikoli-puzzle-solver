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
            answer: "m=edit&p=7VbRbpswFH3PV0x+2iQ/YBuawFvXdXtpu3VkqioURSSlDSoJHSHrRJR/370XpwS4kaZN1V4mGuvk+Pr4xDbHXX/fxEUiPXjMSDpSwaP1iD6ug3/7Z5yWWRK8kaebcpEXAKT8fCXv42ydDCJbNBlsKz+ormX1KYiEElJo+CgxkdV1sK0ug+pWViF0CamAu6iLNMDzBt5QP6KzmlQO4CuLAd4CnKfFPEumYVhTX4KoGkuBE72n4QjFMv+RCGsEv8/z5SxFYhaX8GPWi/TJ9qw3d/njRuzn2MnqtPYbMn5N49e8+DW8X932e/EKdv3Jbgfr/hUMT4MIvX9r4KiBYbDdoS9sFbW3wVZoB2QUSNJBmF6SQaFVzVrbljU8azjWZXVdzbJDVsHnaj2Hq/VYZ94JqzDkWOWgNS07J0so5RzhDc/rIzp6xPPmiD4tdpeHTftIW6epHcPOyspQ+4Fah1qP2guqOaf2htozal1qT6hmiGcDTs+hxkl7tPA1HGlwY6TwjaSFQugCNAShV9I6EYZqVVcD12AHhipteXWAsd7qKKxxLR4B9pt6bfWVf4BhrLb62jnAWG/1NdZYfT2UtA8v9VYfwq7BMNZYfe13MI7tvET1iof7F+plV3DFd4NI15mKj/d7aDKIRLiInxIBcSrWeTZdb4r7eA7ZQGkriVttlrOkaFFZnj9l6apdlz6s8iJhu5BM7h64+lle3HXUn+MsaxH1+9Oi6rPaosoibX2PiyJ/bjHLuFy0iIO4ayklq7JtoIzbFuPHuDPbsvnNu4H4KegTGbirzP+76l/dVbgH6u9uLFE8zOK3jtSeh/+0vBP1lbWn6w6izRHasLTLa+O1xdFDXsRnqz2HrfZ4g3h3cSJDlqZQblT2rHJY1nCsZhUwLfusYXXbS03sq91Xf3Z2XssOZU1esEENNJPVwLKZbPleLAPfC2CcsJ/BwDIxDGw3iYHqhzGQvTwG7kgko2o3ldFVN5hxql4241SH8RxNBr8A",
        },
    ],
});
