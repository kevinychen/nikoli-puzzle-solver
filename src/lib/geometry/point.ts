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
}
