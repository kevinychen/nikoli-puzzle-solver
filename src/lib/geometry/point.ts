import { Vector } from "./vector";

export class Point {
    constructor(readonly y: number, readonly x: number) {}

    directionTo(p: Point): Vector {
        return new Vector(p.y - this.y, p.x - this.x);
    }

    eq(p: Point): boolean {
        return this.y === p.y && this.x === p.x;
    }

    toString(): string {
        return this.y + "," + this.x;
    }

    translate(v: Vector): Point {
        return new Point(this.y + v.dy, this.x + v.dx);
    }

    static center(...points: Point[]) {
        return new Point(
            points.reduce((a, b) => a + b.y, 0) / points.length,
            points.reduce((a, b) => a + b.x, 0) / points.length
        );
    }

    static compare(p1: Point, p2: Point) {
        return p1.y - p2.y || p1.x - p2.x;
    }

    /** Whether the line segment p1-p2 intersects the line segment q1-q2 */
    static intersect(p1: Point, p2: Point, q1: Point, q2: Point) {
        const [dp, dq] = [p1.directionTo(p2), q1.directionTo(q2)];
        return (
            p1.directionTo(q1).crossProduct(dp) * p1.directionTo(q2).crossProduct(dp) < 0 &&
            q1.directionTo(p1).crossProduct(dq) * q1.directionTo(p2).crossProduct(dq) < 0
        );
    }
}
