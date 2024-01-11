import { zip } from "lodash";
import { Vector } from "./geometry/vector";

export class Symbol {
    static WATER = new Symbol("battleship_B", 7);
    static WHITE_CIRCLE = new Symbol("circle_M", 1);
    static VERY_SMALL_WHITE_CIRCLE = new Symbol("circle_SS", 8);
    static PLUS_SIGN = new Symbol("math", 2);
    static MINUS_SIGN = new Symbol("math", 3);
    static NW_TO_SE = new Symbol("ox_B", 5);
    static NE_TO_SW = new Symbol("ox_B", 6);
    static STAR = new Symbol("star", 2);
    static LIGHT_BULB = new Symbol("sun_moon", 3);
    static BOMB = new Symbol("sun_moon", 4);
    static TENT = new Symbol("tents", 2);

    constructor(
        /** Corresponds to the "Selection" string in Penpa. */
        readonly shape: string,
        /**
         * The index of the shape in the Penpa shape dialog (1-indexed). This may be a list if there
         * are multiple shapes in the same cell.
         */
        readonly style: number | number[]
    ) {}

    eq(symbol: Symbol): boolean {
        return this.shape === symbol.shape && this.style === symbol.style;
    }

    getArrows(): Vector[] {
        return typeof this.style === "number"
            ? [Symbol.getDirections(this.shape)[this.style]]
            : zip(Symbol.getDirections(this.shape), this.style)
                  .filter(([_, flag]) => flag)
                  .map(([v]) => v);
    }

    isBlack(): boolean {
        return this.shape.endsWith("_B") || this.style === 2;
    }

    isCircle(): boolean {
        return this.shape.startsWith("circle_") || (this.shape === "ox_B" && this.style === 1);
    }

    isSquare(): boolean {
        return this.shape.startsWith("square_");
    }

    isWhite(): boolean {
        return this.style === 1;
    }

    toGreen(): Symbol {
        return new Symbol(this.shape.replace("_B", "_E"), this.style);
    }

    toString(): string {
        return this.shape + "," + this.style;
    }

    static fromArrow(shape: string, v: Vector) {
        return new Symbol(
            shape,
            this.getDirections(shape).findIndex(w => w.eq(v))
        );
    }

    private static getDirections(shape: string): Vector[] {
        const unused = new Vector(0, 0);

        if (shape.startsWith("arrow_fouredge_") || shape === "cross") {
            return [Vector.E, Vector.S, Vector.W, Vector.N, Vector.W, Vector.N, Vector.E, Vector.S];
        } else if (shape === "arrow_cross") {
            return [Vector.W, Vector.N, Vector.E, Vector.S, Vector.W, Vector.N, Vector.E, Vector.S];
        } else if (shape === "arrow_S" || shape.startsWith("arrow_B_") || shape.startsWith("arrow_N_")) {
            return [unused, Vector.W, Vector.NW, Vector.N, Vector.NE, Vector.E, Vector.SE, Vector.S, Vector.SW];
        } else if (shape === "firefly" || shape === "pencils") {
            return [unused, Vector.E, Vector.S, Vector.W, Vector.N];
        } else if (shape === "inequality") {
            return [unused, Vector.W, Vector.N, Vector.E, Vector.S, Vector.W, Vector.N, Vector.E, Vector.S];
        } else {
            return [];
        }
    }
}
