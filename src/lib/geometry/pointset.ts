import { ValueMap } from "../collections";
import { Bearing } from "./bearing";
import { Lattice } from "./lattice";
import { Point } from "./point";
import { Vector } from "./vector";

export class PointSet {
    private map = new ValueMap<Point, number>([]);

    constructor(readonly lattice: Lattice, values: Point[]) {
        values.forEach((value, i) => this.map.set(value, i));
    }

    [Symbol.iterator](): Iterator<Point, any, undefined> {
        const it = this.map.keys();
        return {
            next: () => {
                const next = it.next();
                return {
                    done: next.done,
                    value: next.value,
                };
            },
        };
    }

    /**
     * @returns all [p, q, v] for p and q both in this set that share an edge, and v is the
     * direction from p to q
     */
    edges(): [Point, Point, Vector][] {
        return [...this.keys()].flatMap(p =>
            this.edgeSharingNeighbors(p).map(([q, v]) => [p, q, v] as [Point, Point, Vector])
        );
    }

    /** @returns all points in this set that share an edge with p */
    edgeSharingPoints(p: Point): Point[] {
        return this.lattice.edgeSharingPoints(p).filter(q => this.has(q));
    }

    /**
     * @returns all [q, v] for q in this set that shares an edge with p, and v is the direction from
     * p to q
     */
    edgeSharingNeighbors(p: Point): [Point, Vector][] {
        return this.lattice.edgeSharingNeighbors(p).filter(([q]) => this.has(q));
    }

    has(p: Point): boolean {
        return this.map.has(p);
    }

    /** @returns a unique number for each point in this set */
    index(p: Point): number {
        return this.map.has(p) ? this.map.get(p) : -1;
    }

    keys(): IterableIterator<Point> {
        return this.map.keys();
    }

    /** @returns a list of all points in this set, starting from p and in the given bearing */
    lineFrom(p: Point, bearing: Bearing, good: (q: Point) => boolean = () => true): Point[] {
        const line = [];
        while (this.has(p) && good(p)) {
            line.push(p);
            p = bearing.next(p);
        }
        return line;
    }

    /**
     * @returns all [line, p, bearing] where line consists of a straight line of cells aligned with
     * the lattice, p is the point right before the first cell of the line, and v is the bearing of
     * the line starting from p.
     */
    lines(): [Point[], Point, Bearing][] {
        const lines = [];
        for (const p of this) {
            for (const bearing of this.lattice.bearings()) {
                const q = bearing.negate().next(p);
                if (!this.has(q)) {
                    lines.push([this.lineFrom(p, bearing), q, bearing] as [Point[], Point, Bearing]);
                }
            }
        }
        return lines;
    }

    /**
     * @returns a map from each point to a list of [placement, instance, type]. This represents all
     * different placements of one of the given shapes in this point set. Instance is the index of
     * which shape is used, and type is a unique number for each placement.
     */
    placements(shapes: Point[][], includeRotationsAndReflections = true): ValueMap<Point, [Point[], number, number][]> {
        const transforms = includeRotationsAndReflections ? this.lattice.pointGroup() : [(p: Point) => p];
        const placements = new ValueMap<Point[], number>([]);
        for (const [instance, shape] of shapes.entries()) {
            for (const transform of transforms) {
                const transformed = shape.map(transform).sort(Point.compare);
                for (const p of this) {
                    const v = transformed[0].directionTo(p);
                    if (this.lattice.inBasis(v)) {
                        const placement = transformed.map(p => p.translate(v));
                        if (placement.every(p => this.has(p))) {
                            placements.set(placement, instance);
                        }
                    }
                }
            }
        }
        const placementsMap = new ValueMap<Point, [Point[], number, number][]>(this, () => []);
        for (const [type, [placement, instance]] of [...placements].entries()) {
            for (const p of placement) {
                placementsMap.get(p).push([placement, instance, type]);
            }
        }
        return placementsMap;
    }

    /** @returns a new point set that contains all vertices of points in this set */
    vertexSet(): PointSet {
        return new PointSet(
            this.lattice.dual(),
            [...this.keys()].flatMap(p => this.lattice.vertices(p))
        );
    }

    /** @returns all points in this set that share a vertex with p */
    vertexSharingPoints(p: Point): Point[] {
        return this.lattice.vertexSharingPoints(p).filter(q => this.has(q));
    }

    /**
     * @returns all [q, v] for q in this set that shares a vertex with p, and v is the direction
     * from p to q
     */
    vertexSharingNeighbors(p: Point): [Point, Vector][] {
        return this.lattice.vertexSharingNeighbors(p).filter(([q]) => this.has(q));
    }

    /**
     * @returns all vertices in this set surrounded by points in this set (a vertex is represented
     * by all points around it)
     */
    vertices(): Point[][] {
        const vertices = [];
        for (const p of this.keys()) {
            for (const v of this.lattice.vertices(p)) {
                const neighbors = this.lattice
                    .vertexSharingPoints(p)
                    .filter(q => this.lattice.vertices(q).some(w => w.eq(v)));
                if (neighbors.every(q => this.has(q)) && neighbors.every(q => this.index(q) < this.index(p))) {
                    vertices.push([p, ...neighbors]);
                }
            }
        }
        return vertices;
    }
}
