import { Constraints, Context, Puzzle, Solution, ValueMap, ValueSet } from "../lib";

const solve = async ({ Or }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a black or white circle in every cell
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Some circles are given
    const symbols = [...new ValueSet([...puzzle.symbols.values()])];
    for (const [p, symbol] of puzzle.symbols) {
        cs.add(grid.get(p).eq(symbols.findIndex(s => s.eq(symbol))));
    }

    // All circles of the same color must be orthogonally contiguous
    for (const i of [0, 1]) {
        cs.addAllConnected(puzzle.points, p => grid.get(p).eq(i));
    }

    // There can not be a 2x2 square of all black or all white circles
    for (const vertex of puzzle.points.vertices()) {
        for (const i of [0, 1]) {
            cs.add(Or(...vertex.map(p => grid.get(p).eq(i))));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved symbols
    for (const [p, arith] of grid) {
        if (!puzzle.symbols.has(p)) {
            solution.symbols.set(p, symbols[model.get(arith)]);
        }
    }
};

solverRegistry.push({
    name: "Yin-Yang",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRfb9o+FH3nU/zkZz/kDzDIW9eVvbBuHUwViiJkwC1RE8ycZJ2M+O699yZTcOJJ06Tq14fJ5OhwfPE9Jj4uvldCSz6CEU64x30YQTChZ+jh59dYpmUmo//4VVXulQbC+efZjD+IrJCDuKlKBiczjcwdNx+jmPmMswAenyXc3EUn8ykyK24WMMW4D9q8LgqA3rT0nuaRXdei7wG/bTjQFdBtqreZXM9r5UsUmyVn2Oc9/Ropy9UPyRof+H2r8k2KwkaUsJlinx6bmaLaqaeqqfWTMzdXtd2Fw27Y2kVa20XmsIu7eGW70+R8hr/9KxheRzF6/9bSSUsX0QnwltAnXEUnFk5gmQCaXRpkQ9+pTl3qaAzqpKuOvX4ttJxR44BwCb64CQk/EHqEI8I51dwQ3hNeEw4Jx1TzDnf213t/JTtxUMcIx+jPWDKI2WIvjpJBgFihsnVR6QexheNA+YI3DtqhyjdSW1Km1DFLD3Zd+nhQWjqnUJS7R1f9RuldZ/VnkWWWUN8WllS/X0sqNZzai+9Ca/VsKbko95ZwccKtleShtA2UwrYonkSnW97u+TxgPxk9cQi3U/jvdvqfbid8Bd5by+lbs0OnV2ln9EF2pB9UZ8obvRd00HuRxob9VIPqCDao3WyD1I83iL2Eg/abkOOq3Zyjq27UsVUv7djqMvBxMngB",
            answer: "m=edit&p=7VXfb5swEH7nr5j87AewISG8dW2zl+xHl0xVhKLISWiDSuLMwDoR8b/vbNIQw02qJlXbw+RwOj4fd985/uz8eylUQgMYPKQu9WAwFprHd/XvZczSIkuid/SqLLZSgUPp5/GYPogsT5z4FLVwjtUoqu5o9SGKiUcoYfB4ZEGru+hYfYyqOa2mMEWoB9ikCWLg3rbuvZnX3nUDei74n04+uHNw16laZ8ly0iBforiaUaLrvDdfa5fs5I+EnHjo97XcrVINrEQBzeTb9HCaycuNfCrJS4maVlcN3SlCl7d0+Zkux+myt6c7WtQ1LPtXILyMYs39W+uGrTuNjrXmpa1n7Dw6Eh5CGkZtgsT3UHSEocEA0LCLDtx+LJQcm8LM2BnwohU39sZY19jA2ImJuTX23thrY31jByZmqDuD3i9zDHpfX7bcVJie22cITdi0aPuMoShHUR9F0QXkLraA3ENRhqIoBz7CYn20Yx/tzR+iaIjlDdAuAnQlgyEai+dFujhvHr0xaidmzcGlR/A6b+HEZLoVh4TAkUVymS3zUj2INQjQnGjUYPtyt0qUBWVSHrJ0b8elj3upEnRKg8nmEYtfSbXpZH8WWWYBuTmfLahZCAsqVGq9C6Xks4XsRLG1gIszxcqU7AubQCFsiuJJdKrt2p5rh/wk5ok53Af8/33wl+4D/Re4f3wrvNlB/W/RMbtXKlT6ACPqBxRV+QnvCR3wnqR1wb6qAUWEDWhX2wD15Q1gT+GA/UbkOmtX55pVV+q6VE/tutSl4OOF8ws=",
        },
    ],
});
