import { ValueMap, ValueSet } from "./collections";
import { Point } from "./geometry/point";
import { Vector } from "./geometry/vector";
import { Symbol } from "./symbol";

/**
 * After finding the solved integers from Z3, each puzzle solver should set these values.
 * The framework will populate the Penpa grid with these values.
 * These fields are documented in puzzle.ts.
 */
export class Solution {
    shaded: ValueSet<Point>;
    texts: ValueMap<Point, string>;
    symbols: ValueMap<Point, Symbol>;
    edgeTexts: ValueMap<[Point, Vector], string>;
    borders: ValueSet<[Point, Point]>;
    lines: ValueMap<[Point, Point], true | number>;
}
