import { range } from "lodash";
import { Constraints, Context, Point, Puzzle, Solution } from "../lib";

const solve = async ({ And, Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    const allLetters = [...new Set(puzzle.texts.values())];
    const grid = range(puzzle.width).map(_ => cs.choice(allLetters));
    cs.add(...grid.map(arith => arith.neq(-1)));

    for (let y = 0; y < puzzle.height - 1; y++) {
        // Find all matches from guess to answer word
        const guess = range(puzzle.width).map(x => puzzle.texts.get(new Point(y, x)));
        const matches = range(puzzle.width).map(_ => cs.int(-1, puzzle.width - 1));
        for (const [x, arith] of grid.entries()) {
            // All matches are correct
            for (const [xx, c] of guess.entries()) {
                cs.add(Implies(matches[x].eq(xx), arith.is(c)));
            }

            // All matches must be different
            cs.add(Sum(...matches.map(match => match.eq(x))).le(1));

            // If a character in the answer matches one in the guess, then either they are a match,
            // or both are matched to something else
            for (const [xx, c] of guess.entries()) {
                cs.add(Implies(arith.is(c), Or(matches[x].neq(-1), ...matches.map(arith => arith.eq(xx)))));
            }

            // An exact match must match to the same index
            cs.add(Implies(arith.is(guess[x]), matches[x].eq(x)));
        }

        // A black circle corresponds to a correct letter in the correct location
        const numBlacks = [...puzzle.symbols].filter(([p, symbol]) => p.y === y && symbol.isBlack()).length;
        cs.add(Sum(...range(puzzle.width).map(x => matches[x].eq(x))).eq(numBlacks));

        // A white circle corresponds to a correct letter in the wrong location
        const numWhites = [...puzzle.symbols].filter(([p, symbol]) => p.y === y && !symbol.isBlack()).length;
        cs.add(Sum(...range(puzzle.width).map(x => And(matches[x].neq(x), matches[x].neq(-1)))).eq(numWhites));
    }

    const model = await cs.solve(grid.entries());

    // Fill in solved letters
    for (const [x, arith] of grid.entries()) {
        solution.texts.set(new Point(puzzle.height - 1, x), allLetters[model.get(arith)]);
    }
};

solverRegistry.push({
    name: "Mastermind",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZVNb5tMEMfv/hTRnvfAuwm3NI3bSqnzYldRhFC0dkiMAt50wU8eYfm7Z2YgYmGp1B6i5lAhRuMfO7P/3eWPy587oVIecp+7Ibe4DZfrOdxxQu5Op3Rb7bXMqjyNjvjJrtpIBQnnF7MZfxB5mU7iZoybTPb1cVRf8fpLFDObcebAbbOE11fRvv4e1XNeL+AR4zaw82aQA+lZl97Qc8xOG2hbkM/bHNJbSNeZWufp3XlDLqO4XnKG83yiakxZIf9LWasDf69lscoQrEQFiyk32XP7pNzdy6ddO9ZODrw+aeQuRuS6nVxMG7mYjcjFVbyz3OPkcIBtvwbBd1GM2n90adili2gPcR7tmRNg6Qy0NGfDnCkCFPcGQgTfNHCM4LoDroVgqQEqWWiASi474FHJhQbsQVPPGTT1qUTr4Q9LfCrRmvoughsNeIPFBVSijQio5KsGqOREA/6wB23h2RuAjbVpe29he13U6MD56WfOXJzVpDg19OhTD6kx1kcRJkUlRgcfT9SgAVKjQ4AnZ1I8vkEHWOCMlulQXMKLxWuX4meKFkWf4jmNOaN4Q/GUokcxoDFTfDX/6OXVd/qd5MROQF9CvMLfy5JJzOa7YpWqo7lUhcjBqIuNeE4ZfBFZKfO7cqcexBr8TR9MsDCwLVX0UC7lc55t++Oyx61U6egjhOn949j4lVT3g+4vIs97oPkD6KHmvHuoUvAZ0n4LpeRLjxSi2vSA9snqdUq3VV9AJfoSxZMYzFZ0az5M2P+M7tj993fzF/9u8Aisj+bbjyaH3l6pRq0PeMT9QEdd3nLD6MANS+OEpquBjhgb6NDbgEx7AzQcDuwXJseuQ5+jqqHVcSrD7TiVbvg4mbwC",
            answer: "m=edit&p=7ZXfb5swEMff81dUfvYD2PwKb13XbJOy9EcyVRWKIpLQBpWEDsg6EeV/791BAxhP2h6q7WFCWMcH3/lrn8/Ov+/DLOIet7n0uMFNeKQluBAel65Lr1E/s7hIIv+Mn++LTZqBwfnVaMQfwiSPBkHVR84Hh3Lolze8/OQHzGScCXhNNufljX8ov/rlhJdT+MW4CWxcdRJgXjbmHf1H66KCpgH2pLbBvAdzFWerJFqMK3LtB+WMMxznA3mjybbpj4jVOvB7lW6XMYJlWMBk8k38XP/J9+v0ac/ehjjy8rySO9XIlY1ceZIr9XLF+8sdzo9HWPZbELzwA9T+rTG9xpz6hyPqOjDhoOsItFS5YcJFMG4BD8GXFhgiuG2ANBDMWoBcpi1ALtcNsMjlqgVMJagllKC2ocSwVRdbKEFtieCuBSxlco5Qejjk8rkFyOW8BWw1Bi3h5RuAhTVpee9heSVqFLybcyaFluLQpkotqetr21rq6CLYro46ri6C42npsB8BJjiiaQpqZ7CxeCmp/UitQa1N7Zj6XFJ7R+0FtRa1DvVxcWvC5m3HcHreuGddq06aqDPg2nXSTsCp9+wJuPVeOQGvzqLoJq1SPX1L4GlmqPo4CIRDByM+3u9Z80HAJvvtMsrOJmm2DROo2+kmfI4YHJAsT5NFvs8ewhWUO52fnNiOPDooSdPnJN51+8WPuzSLtL8QRutHXf9lmq2V6C9hknRATvdBB1Xp76AiizvfYZalLx2yDYtNB7ROsE6kaFd0BRRhV2L4FCqjbZs5HwfsJ6M3kP9vn794+2AKjD+6g9oH5rudKv+WHNq9aaYtfcCa6geqrfKa9wodeK+kccB+VQPVFDZQtbYB9csbYK/Cgf2iyDGqWueoSi11HKpX7ThUu+CD+eAV",
        },
    ],
});
