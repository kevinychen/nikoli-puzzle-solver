import { Point } from "./point";
import { Vector } from "./vector";

/** A direction along which you can move in a line in a lattice */
export interface Bearing {
    /** Whether the two bearings are equal */
    eq(bearing: Bearing): boolean;

    /** The vector from p to the next point along the bearing direction */
    from(p: Point): Vector | undefined;

    /** The next n points along the bearing direction */
    line(p: Point, n: number): Point[];

    /** The bearing representing the opposite direction */
    negate(): Bearing;

    /** The next point along the bearing direction */
    next(p: Point): Point | undefined;
}
