import { Arith, Bool, CoercibleToArith, Context as Z3Context } from "z3-solver";
import { Constraints } from "./constraints";
import { Puzzle } from "./puzzle";
import { Solution } from "./solution";

export type Context<Name extends string = "main"> = Z3Context<Name> & {
    Sum: (...args: (CoercibleToArith<Name> | Bool<Name>)[]) => Arith<Name>;
};

export interface Sample {
    /** The name of this sample. Defaults to the puzzle type. */
    name?: string;

    /** The Penpa URL, starting from the "m=edit&p=". */
    puzzle: string;

    /** The parameters of the sample puzzle, if any. */
    parameters?: string;

    /** The Penpa URL of the completed solution, starting from the "m=edit&p=". */
    answer: string;
}

export interface PuzzleSolver {
    /** The name of the puzzle type, e.g. "Sudoku". */
    name: string;

    /** Other names or keywords that can be searched to find this puzzle type, e.g. "Number Place". */
    keywords?: string[];

    /** The default parameters of the puzzle type, if any. */
    parameters?: string;

    /**
     * Function to solve an instance of this puzzle type.
     *
     * @param context The Z3 context to use. This contains functions to use in your constraints, e.g. And, If, Implies.
     * @param puzzle The puzzle inputted in the Penpa UI, converted to a friendly form.
     * @param cs Add constraints to this object, and call solve to get the results.
     * @param solution An empty solution object. Should be modified by this function with the results.
     */
    solve: (context: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => Promise<void>;

    /** Samples of this puzzle. */
    samples: Sample[];
}
