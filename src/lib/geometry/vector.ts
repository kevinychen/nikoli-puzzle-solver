export class Vector {
    static E = new Vector(0, 1);
    static NE = new Vector(-1, 1);
    static N = new Vector(-1, 0);
    static NW = new Vector(-1, -1);
    static W = new Vector(0, -1);
    static SW = new Vector(1, -1);
    static S = new Vector(1, 0);
    static SE = new Vector(1, 1);

    constructor(readonly dy: number, readonly dx: number) {}

    angle(): number {
        return Math.atan2(this.dy, this.dx);
    }

    crossProduct(v: Vector): number {
        return this.dx * v.dy - this.dy * v.dx;
    }

    dotProduct(v: Vector): number {
        return this.dx * v.dx + this.dy * v.dy;
    }

    eq(v: Vector): boolean {
        return this.dy === v.dy && this.dx === v.dx;
    }

    negate(): Vector {
        return new Vector(-this.dy, -this.dx);
    }

    scale(s: number): Vector {
        return new Vector(this.dy * s, this.dx * s);
    }

    toString(): string {
        return this.dy + "," + this.dx;
    }

    translate(v: Vector): Vector {
        return new Vector(this.dy + v.dy, this.dx + v.dx);
    }
}
