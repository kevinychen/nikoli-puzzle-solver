import { isEqual, zip } from "lodash";
import { Point } from "./point";
import { Vector } from "./vector";
import { ValueSet } from "../collections";

export type Shape = Vector[];

export enum TransformationType {
    NONE,
    ALLOW_ROTATIONS,
    ALLOW_ROTATIONS_AND_REFLECTIONS,
}

export type TransformationFunction = (_: Vector) => Vector;

export interface Lattice {
    /** @returns the dual lattice, i.e. the lattice of the vertices */
    dual: () => Lattice;

    /** @returns all directions between some two points that share an edge */
    edgeSharingDirections: () => Vector[];

    /** @returns all points that share an edge with p */
    edgeSharingPoints: (p: Point) => Point[];

    /** @returns all [q, v] for q that shares an edge with p */
    edgeSharingNeighbors: (p: Point) => [Point, Vector][];

    /** @returns all sets of opposite edge sharing directions */
    oppositeDirections: () => [Vector, Vector][];

    /** @returns the origin point of the lattice */
    origin: () => Point;

    /** @returns all polyominoes of the given number of edge-connected cells */
    polyominoes: (size: number, includeRotationsAndReflections?: boolean) => Shape[];

    /**
     * @returns all functions that convert vectors to transformed vectors, allowing for the given
     * transformation types
     */
    transformationFunctions: (type: TransformationType) => TransformationFunction[];

    /** @returns all directions between some two points that share a vertex */
    vertexSharingDirections: () => Vector[];

    /** @returns all points that share a vertex with p */
    vertexSharingPoints: (p: Point) => Point[];

    /** @returns all [q, v] for q that shares a vertex with p */
    vertexSharingNeighbors: (p: Point) => [Point, Vector][];

    /**
     * @returns the coordinates of all vertices of p
     * in 2D, each vertex is just counterclockwise of the corresponding edge sharing direction
     */
    vertices: (p: Point) => Point[];
}

abstract class AbstractLattice implements Lattice {
    abstract dual(): Lattice;

    abstract edgeSharingDirections(): Vector[];

    edgeSharingPoints(p: Point) {
        return this.edgeSharingDirections().map(v => p.translate(v));
    }

    edgeSharingNeighbors(p: Point): [Point, Vector][] {
        return this.edgeSharingPoints(p).map(q => [q, p.directionTo(q)]);
    }

    oppositeDirections() {
        return [...new ValueSet(this.edgeSharingDirections().map(v => [v, v.negate()].sort() as [Vector, Vector]))];
    }

    abstract origin(): Point;

    polyominoes(size: number, includeRotationsAndReflections: boolean = false) {
        const transforms = this.transformationFunctions(
            includeRotationsAndReflections
                ? TransformationType.NONE
                : TransformationType.ALLOW_ROTATIONS_AND_REFLECTIONS
        );
        const polyominoes: Shape[] = [];
        const polyomino = [this.origin()];

        const vectorCompare = (v1: Vector, v2: Vector) => v1.dy - v2.dy || v1.dx - v2.dx;

        const shapeCompare = (shape1: Shape, shape2: Shape) => {
            for (const [v1, v2] of zip(shape1, shape2)) {
                if (!v1.eq(v2)) {
                    return v1.dy - v2.dy || v1.dx - v2.dx;
                }
            }
        };

        const recurse = () => {
            if (polyomino.length === size) {
                const canonized = transforms
                    .map(transform => {
                        const transformed = polyomino.map(p => transform(new Vector(p.y, p.x))).sort(vectorCompare);
                        return transformed.map(p => p.translate(transformed[0].negate()));
                    })
                    .sort(shapeCompare)[0];
                if (!polyominoes.some(shape => isEqual(shape, canonized))) {
                    polyominoes.push(canonized);
                }
                return;
            }

            for (const p of polyomino) {
                for (const q of this.edgeSharingPoints(p)) {
                    if (!polyomino.some(r => q.eq(r))) {
                        polyomino.push(q);
                        recurse();
                        polyomino.pop();
                    }
                }
            }
        };

        recurse();
        return polyominoes.sort(shapeCompare);
    }

    abstract transformationFunctions(type: TransformationType): TransformationFunction[];

    abstract vertexSharingDirections(): Vector[];

    vertexSharingPoints(p: Point) {
        return this.vertexSharingDirections().map(v => p.translate(v));
    }

    vertexSharingNeighbors(p: Point): [Point, Vector][] {
        return this.vertexSharingPoints(p).map(q => [q, p.directionTo(q)]);
    }

    abstract vertices(p: Point): Point[];
}

class RectangularLattice extends AbstractLattice {
    dual() {
        return Lattices.RECTANGULAR;
    }

    edgeSharingDirections() {
        return [new Vector(0, 1), new Vector(-1, 0), new Vector(0, -1), new Vector(1, 0)];
    }

    origin() {
        return new Point(0, 0);
    }

    transformationFunctions(type: TransformationType) {
        let functions: TransformationFunction[] = [v => v];

        if (type !== TransformationType.NONE) {
            functions = functions.flatMap(f => [
                v => f(v),
                v => f(new Vector(v.dx, -v.dy)),
                v => f(new Vector(-v.dy, -v.dx)),
                v => f(new Vector(-v.dx, v.dy)),
            ]);

            if (type === TransformationType.ALLOW_ROTATIONS_AND_REFLECTIONS) {
                functions = functions.flatMap(f => [v => f(v), v => f(new Vector(-v.dy, v.dx))]);
            }
        }

        return functions;
    }

    vertexSharingDirections() {
        return [
            new Vector(0, 1),
            new Vector(-1, 1),
            new Vector(-1, 0),
            new Vector(-1, -1),
            new Vector(0, -1),
            new Vector(1, -1),
            new Vector(1, 0),
            new Vector(1, 1),
        ];
    }

    vertices(p: Point) {
        return [
            new Point(p.y - 0.5, p.x + 0.5),
            new Point(p.y - 0.5, p.x - 0.5),
            new Point(p.y + 0.5, p.x - 0.5),
            new Point(p.y + 0.5, p.x + 0.5),
        ];
    }
}

class HexagonalLattice extends AbstractLattice {
    dual() {
        return Lattices.TRIANGULAR;
    }

    edgeSharingDirections() {
        return [
            new Vector(0, 2),
            new Vector(-3, 1),
            new Vector(-3, -1),
            new Vector(0, -2),
            new Vector(3, -1),
            new Vector(3, 1),
        ];
    }

    origin() {
        return new Point(0, 0);
    }

    transformationFunctions(type: TransformationType) {
        let functions: TransformationFunction[] = [v => v];

        if (type !== TransformationType.NONE) {
            functions = functions.flatMap(f => [
                v => f(v),
                v => f(new Vector((v.dy - 3 * v.dx) / 2, (v.dy + v.dx) / 2)),
                v => f(new Vector((-v.dy - 3 * v.dx) / 2, (v.dy - v.dx) / 2)),
                v => f(new Vector(-v.dy, -v.dx)),
                v => f(new Vector((-v.dy + 3 * v.dx) / 2, (-v.dy - v.dx) / 2)),
                v => f(new Vector((v.dy + 3 * v.dx) / 2, (-v.dy + v.dx) / 2)),
            ]);

            if (type === TransformationType.ALLOW_ROTATIONS_AND_REFLECTIONS) {
                functions = functions.flatMap(f => [v => f(v), v => f(new Vector(-v.dy, v.dx))]);
            }
        }

        return functions;
    }

    vertexSharingDirections() {
        return this.edgeSharingDirections();
    }

    vertices(p: Point) {
        return [
            new Point(p.y - 1, p.x + 1),
            new Point(p.y - 2, p.x),
            new Point(p.y - 1, p.x - 1),
            new Point(p.y + 1, p.x - 1),
            new Point(p.y + 2, p.x),
            new Point(p.y + 1, p.x + 1),
        ];
    }
}

class TriangularLattice extends AbstractLattice {
    dual() {
        return Lattices.HEXAGONAL;
    }

    edgeSharingDirections() {
        return [
            new Vector(-1, 1),
            new Vector(-2, 0),
            new Vector(-1, -1),
            new Vector(1, -1),
            new Vector(2, 0),
            new Vector(1, 1),
        ];
    }

    edgeSharingPoints(p: Point) {
        return super.edgeSharingPoints(p).filter(p => p.y % 3 !== 1);
    }

    origin() {
        return new Point(0, 0);
    }

    transformationFunctions(type: TransformationType) {
        let functions: TransformationFunction[] = [v => v];

        if (type !== TransformationType.NONE) {
            functions = functions.flatMap(f => [
                v => f(v),
                v => f(new Vector((v.dy - 3 * v.dx) / 2, (v.dy + v.dx) / 2)),
                v => f(new Vector((-v.dy - 3 * v.dx) / 2, (v.dy - v.dx) / 2)),
                v => f(new Vector(-v.dy, -v.dx)),
                v => f(new Vector((-v.dy + 3 * v.dx) / 2, (-v.dy - v.dx) / 2)),
                v => f(new Vector((v.dy + 3 * v.dx) / 2, (-v.dy + v.dx) / 2)),
            ]);

            if (type === TransformationType.ALLOW_ROTATIONS_AND_REFLECTIONS) {
                functions = functions.flatMap(f => [v => f(v), v => f(new Vector(v.dy, -v.dx))]);
            }
        }

        return functions;
    }

    vertexSharingDirections() {
        const directions = [];
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const d = Math.abs(dy) + Math.abs(dx);
                if ((dy + dx) % 2 === 0 && d > 0 && d <= 4) {
                    directions.push(new Vector(dy, dx));
                }
            }
        }
        return directions;
    }

    vertexSharingPoints(p: Point) {
        return super.vertexSharingPoints(p).filter(p => p.y % 3 !== 1);
    }

    vertices(p: Point) {
        if (p.y % 3 === 0) {
            return [new Point(p.y - 2, p.x), new Point(p.y + 1, p.x - 1), new Point(p.y + 1, p.x + 1)];
        } else {
            return [new Point(p.y - 1, p.x - 1), new Point(p.y + 2, p.x), new Point(p.y + 1, p.x + 1)];
        }
    }
}

export class Lattices {
    static RECTANGULAR = new RectangularLattice();

    /** A lattice where each cell is a hexagon with a pointy top */
    static HEXAGONAL = new HexagonalLattice();

    /**
     * A lattice where each cell is a triangle with either a pointy top or a pointy bottom
     * (0,0) is a triangle with a pointy top
     */
    static TRIANGULAR = new TriangularLattice();
}
