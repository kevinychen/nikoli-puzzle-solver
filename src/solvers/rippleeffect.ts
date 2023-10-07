import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ And, Distinct, Implies }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Numbers must be between 1 and N, where N is the size of the region
    const regions = puzzle.regions();
    for (const [p, arith] of grid) {
        cs.add(arith.ge(1), arith.le(regions.get(p).length));
    }

    // Each region contains exactly one of each number
    for (const region of regions) {
        cs.add(Distinct(...region.map(p => grid.get(p))));
    }

    // Two equal numbers N in the same row or column must have at least N spaces between them
    for (const [p, arith] of grid) {
        for (let i = 1; i <= regions.get(p).length; i++) {
            cs.add(
                Implies(
                    arith.eq(i),
                    And(
                        ...puzzle.lattice
                            .edgeSharingDirections()
                            .flatMap(v => puzzle.points.sightLine(p.translate(v), v).slice(0, i))
                            .map(p => grid.get(p).neq(i))
                    )
                )
            );
        }
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
    name: "Ripple Effect",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZfb7s2FH3Pp6h49oON+Wfeuq7dS5eta6eqQlFFUtpGJaEjyToR5bv32Pg6QJimaZvWh59IrHuOL9fnXnMNm992eV2wGJdMGGcCl+SB+Udc/+i6W27LIj1j57vta1XDYOynqyv2nJebYpJZr9lk36i0uWHND2nmCY95Pv7Cm7HmJt03P6bNlDW3mPKYAHfdOvkwL62p6XvjoNmLlhUc9tTaMB9gLpb1oiwer1vm5zRr7pinF/rO3K1Nb1X9XnhWiMaLajVfamKeb5HN5nX5bmc2u6fqbWd9xezAmvNW7+2IXnnUq81WrrZG5Oos/mO5anY4oO6/QPBjmmntvx7N5GjepnuM03TvhZwybTfHiwyBvSIiNkRABO4T5u4HM16Z0TfjHYKzRprxezNyM4ZmvDY+l1hTyJCJIPJSX4cMhiAkEHZBFDERxTTTBQFA6GZizCR0T8JErCyIuyCCW0xuUjIhAwIBQEgACiQpkFhH0joSAaQLgNCSQkuFfFCzVhv6KBSkDS0V+aTAhwJJ2qAgIQUJFChSoELmc6sABrrCKvBFD8BNkJsIAGwAX0gAG9oXPoBd1BcCwMrxBQcgoUoBUAoJklOuiEg7ceVFQWJXeJQqctuIFEJXRCQXUHIxqqNc6AHwuQUwunIAuAUwjqrNBkduTxEtcdFQeOUCoPCK7lGoAaca8B5AaN5xE4r2R6GInIqI89CVV88IRcmp3s7BjdMu6HsIiKQbWoPEge5zEEN1QnI0iF3aQ+CeqrD7vAUoiO5vB3Rvt/fALXZuKGJARQywwQFtsO6swLUZZkKa0W3mgC68PiVaoS40uv3e9PyFGQMzRuYsiPUx9LcOqn9+7PylnMzH9nUuPND/NppNMu/y6aU4m1b1Ki9xhE93q3lRE8ZL09tU5eNmVz/nC7wBzDsVhzy4tfHsUWVVvZfLdd9v+bKu6mJ0SpMFlh/xn1f10yD6R16WPaL9QuhR7busR21rvKg6OK/r6qPHrPLta4/ovNR6kYr1ti9gm/cl5m/5YLXVMefDxPvDM/9M4otEfvsi+b++SPQe8K/W7l9Njnl8q3q090GPtD/Y0Ta3/Emngz/pab3gaVuDHelssMPmBnXa3yBPWhzcn3S5jjpsdK1q2Ot6qZN210t1Oz6bTT4B",
            answer: "m=edit&p=7VZNb9s4EL37VxQ688DvD926bbKXbLZtslgUhhEoidoYlaOubLeFAv/3HdIamRq7QIt2sXtYyCb4HofDN0MNxfVf26qrmYNHecaZgEdxnf6Wxx8+18tNU5fP2PPt5qHtoMPY7+fn7F3VrOvZfLBazJ76UPavWf9rOS9EwQoJf1EsWP+6fOp/K/tL1l/BUMEEcBd7Iwnds6Eb6T+TQWRf7FnBoX859KH7Frp3y+6uqW8u9syrct5fsyIu9EuaHbvFqv1UF4OQiO/a1e0yErfVBqJZPyw/DiPr7X37YVvgEjvWP9/rvTqhVx30qlGuOi1X/vNyw2K3g7y/AcE35Txq/+PQ9YfuVfm0i7qeCsMx0v3mFDYR8kC4RGgkYJ5Is9+m9jy1MrXX4Jz1KrUvU8tTa1J7kWzOYE2hDBPaFqWMLjUFBoHJgbVMWIcjOdAAzDjiYMTjHM+ECwNwObBg5tBMKSaURqABGASgQKECBesoXEeBAzU6ANcKXasA8XDUBnVkBGqDkrISFUhQoFAbKPCowIOCgAqCYZIPCqADVTEokGICwEygmdAADAIFQCOQABQCAUAi4ABQaAgAMAQPwYUxiRC299mWuDHxkCo7biOEYEyWXo3BOchOGF0TIDnHSCdyAHCBI5nqtMF23FPw5kdvkPgwOoDEB5wTIAccc8AnAFzzzEwE3J8ASeSYRJ6lN46IgMGFyc6BGTfZHATC564j8CPI3wMHqr3MgBvDpmB8q0z+vmlIiOEZsAjgMAePOAJJ1JhEDRuscYNjZWmXjRgcMTmIiXfo2o2ud/E8jDX/IrU6tTadBS4eQ3BQ5WeFnZ4Sw/kk9XAcyeE4kmY4sEbCRsJkhIuEyghPfQTiQ+EZNxKG+FCW+FCO+vDURyA+NCc+tCA+tKUEjUXTWHQg4RtBphhJphhHCU+WNVS6FSQ4K8kUq+gU6tRSpY4qddSpU0Sp09QiEGGeEwsviA9PV/FUuqereEN8BE6mBLpKoKsERZQG+moH+tKF6eswfnr3n9Wr7DO8//TGctvN5lKnyxs+5uejxWxenN2/r59dtt2qauAqcrld3dYdYrj8Feu2uVlvu3fVHdxk0t2QJe4xWU6opm0/NsvHqd3y/WPb1SeHIlnD8ifsb9vunnj/XDXNhFinm+6E2t/JJtSmW05w1XXt5wmzqjYPEyK7nE081Y+bqYBNNZVYfajIaqtDzLtZ8aVI/7mCm7X6/2b9b92s4x7w77pf//ht+Ru+ov8tOen1bbuTtQ/0ifIH9mSZD/xRpQN/VNNxweOyBvZEZQNLixuo4/oG8qjEgftKlUevtNCjKlrrcamjco9L5RU/X8z+Bg==",
        },
    ],
});
