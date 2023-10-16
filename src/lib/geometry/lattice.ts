import { isEqual, zip } from "lodash";
import { Matrix, deepEqual, identity, matrix, multiply } from "mathjs";
import { ValueMap, ValueSet } from "../collections";
import { Bearing } from "./bearing";
import { Point } from "./point";
import { Vector } from "./vector";

type Shape = Point[];

export interface Lattice {
    /** @returns the bearing at p that corresponds to the given direction */
    bearing(p: Point, v: Vector): Bearing;

    /** @returns all possible directions of straight lines in the lattice */
    bearings(): Bearing[];

    /** @returns the two cells with the edge with the given midpoint */
    cellsWithEdge(p: Point): [Point, Point];

    /** @returns the cells with the given vertex point */
    cellsWithVertex(p: Point): Point[];

    /** @returns the dual lattice, i.e. the lattice of the vertices */
    dual(): Lattice;

    /** @returns all directions to cells that share an edge with p */
    edgeSharingDirections(p: Point): Vector[];

    /** @returns all [q, v] for q that shares an edge with p */
    edgeSharingNeighbors(p: Point): [Point, Vector][];

    /** @returns all cells that share an edge with p */
    edgeSharingPoints(p: Point): Point[];

    /** @returns the two vertices of the edge between cells p1 to p2 */
    edgeVertices(p1: Point, p2: Point): [Point, Point];

    /** @returns whether this translation maps the lattice to itself */
    inBasis(v: Vector): boolean;

    /** @returns all transformations other than translations that map the lattice to itself */
    pointGroup(): ((p: Point) => Point)[];

    /** @returns all polyominoes with the given number of edge-connected cells */
    polyominoes(size: number, includeRotationsAndReflections?: boolean): Shape[];

    /**
     * @returns a representative for each distinct cell type in the lattice
     * e.g. square and hexagonal grids only have one type, but triangular grids have two, the
     * upward-pointing triangle, and the downward-pointing triangle.
     */
    representativeCells(): Point[];

    /** @returns all directions to cells that share a vertex with p */
    vertexSharingDirections(p: Point): Vector[];

    /** @returns all [q, v] for q that shares a vertex with p */
    vertexSharingNeighbors(p: Point): [Point, Vector][];

    /** @returns all cells that share a vertex with p */
    vertexSharingPoints(p: Point): Point[];

    /** @returns the coordinates of all vertices of p */
    vertices(p: Point): Point[];
}

// The basis of the lattice, (x1,0) and (x2,y2)
interface FundamentalDomain {
    x1: number;
    x2: number;
    y2: number;
}

interface CellRepresentative {
    vertices: Point[];
    center?: Point;
    edges?: [Point, Point][];
    edgeSharingPoints?: Point[];
    vertexSharingPoints?: Point[];
    bearingNeighbors?: ValueMap<Vector, Point>;
}

class LatticeImpl implements Lattice {
    constructor(
        readonly fundamentalDomain: FundamentalDomain,
        readonly representatives: CellRepresentative[],
        readonly pointGroupGenerators: Matrix[],
        readonly _bearings: Vector[]
    ) {
        for (const rep of representatives) {
            rep.center = Point.center(...rep.vertices);
            rep.edges = zip(rep.vertices, [...rep.vertices.slice(1), rep.vertices[0]]);
        }
        for (const rep of representatives) {
            rep.edgeSharingPoints = rep.edges
                .flatMap(edge => this.cellsWithEdge(Point.center(...edge)))
                .filter(p => !p.eq(rep.center));
            rep.vertexSharingPoints = [
                ...new ValueSet(
                    this.vertices(rep.center)
                        .flatMap(v => this.cellsWithVertex(v))
                        .filter(p => !p.eq(rep.center))
                ),
            ].sort((p1, p2) => p1.directionTo(rep.center).angle() - p2.directionTo(rep.center).angle());
        }
        for (const rep of representatives) {
            rep.bearingNeighbors = new ValueMap([]);
            for (const base_v of _bearings) {
                for (const v of [base_v, base_v.negate()]) {
                    for (const [[p, q], neighbor] of zip(rep.edges, rep.edgeSharingPoints)) {
                        if (this.intersect(rep.center, rep.center.translate(v.scale(fundamentalDomain.x1)), p, q)) {
                            rep.bearingNeighbors.set(v, neighbor);
                        }
                    }
                }
            }
        }
    }

    bearing(p: Point, v: Vector): Bearing {
        return this.bearings().find(bearing => bearing.from(p).eq(v));
    }

    bearings(): Bearing[] {
        return this._bearings.flatMap(v => [v, v.negate()]).map(v => new BearingImpl(this, v));
    }

    cellsWithEdge(p: Point) {
        const cells = [];
        for (const rep of this.representatives) {
            for (const edge of rep.edges) {
                const v = Point.center(...edge).directionTo(p);
                if (this.inBasis(v)) {
                    cells.push(rep.center.translate(v));
                }
            }
        }
        return cells as [Point, Point];
    }

    cellsWithVertex(p: Point) {
        const cells = [];
        for (const rep of this.representatives) {
            for (const q of rep.vertices) {
                const v = q.directionTo(p);
                if (this.inBasis(v)) {
                    cells.push(rep.center.translate(v));
                }
            }
        }
        return cells.sort((p1, p2) => p1.directionTo(p).angle() - p2.directionTo(p).angle());
    }

    dual() {
        const vertices: Point[] = [];
        for (const rep of this.representatives) {
            for (const vertex of rep.vertices) {
                if (!vertices.some(v => this.inBasis(v.directionTo(vertex)))) {
                    vertices.push(vertex);
                }
            }
        }
        return new LatticeImpl(
            this.fundamentalDomain,
            vertices.map(p => ({ vertices: this.cellsWithVertex(p) })),
            this.pointGroupGenerators,
            this._bearings
        );
    }

    edgeSharingDirections(p: Point) {
        return this.edgeSharingPoints(p).map(q => p.directionTo(q));
    }

    edgeSharingNeighbors(p: Point): [Point, Vector][] {
        return this.edgeSharingPoints(p).map(q => [q, p.directionTo(q)]);
    }

    edgeSharingPoints(p: Point) {
        for (const rep of this.representatives) {
            const v = rep.center.directionTo(p);
            if (this.inBasis(v)) {
                return rep.edgeSharingPoints.map(p => p.translate(v));
            }
        }
        throw new Error("Point not in lattice: " + p);
    }

    edgeVertices(p1: Point, p2: Point): [Point, Point] {
        const vertices = new ValueSet(this.vertices(p1));
        return this.vertices(p2).filter(v => vertices.has(v)) as [Point, Point];
    }

    inBasis(v: Vector) {
        return (
            v.dy % this.fundamentalDomain.y2 === 0 &&
            (v.dx - (v.dy / this.fundamentalDomain.y2) * this.fundamentalDomain.x2) % this.fundamentalDomain.x1 === 0
        );
    }

    pointGroup() {
        const pointGroup = new ValueSet([identity(3)]);
        for (const g of this.pointGroupGenerators) {
            const powers = [];
            for (let ge = g; !deepEqual(ge, identity(3)); ge = multiply(ge, g)) {
                powers.push(ge);
            }
            for (const h of [...pointGroup]) {
                for (const ge of powers) {
                    pointGroup.add(multiply(h, ge));
                }
            }
        }
        return [...pointGroup].map(h => (p: Point) => {
            const w = (multiply(h, [p.x, p.y, 1]) as any).toArray();
            return new Point(w[1], w[0]);
        });
    }

    polyominoes(size: number, includeRotationsAndReflections?: boolean) {
        const shapeCompare = (shape1: Shape, shape2: Shape) => {
            for (const [p1, p2] of zip(shape1, shape2)) {
                if (!p1.eq(p2)) {
                    return p1.y - p2.y || p1.x - p2.x;
                }
            }
        };

        const transforms = includeRotationsAndReflections ? [(p: Point) => p] : this.pointGroup();
        const polyominoes: Shape[] = [];
        for (const rep of this.representatives) {
            const polyomino = [rep.center];
            const recurse = () => {
                if (polyomino.length === size) {
                    const canonized = transforms
                        .map(transform => {
                            const transformed = polyomino.map(transform).sort(Point.compare);
                            let canonized;
                            for (const otherRep of this.representatives) {
                                const v = transformed[0].directionTo(otherRep.center);
                                if (this.inBasis(v)) {
                                    canonized = transformed.map(p => p.translate(v));
                                }
                            }
                            return canonized;
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
        }

        return polyominoes.sort(shapeCompare);
    }

    representativeCells(): Point[] {
        return this.representatives.map(rep => rep.center);
    }

    vertexSharingDirections(p: Point) {
        return this.vertexSharingPoints(p).map(q => p.directionTo(q));
    }

    vertexSharingNeighbors(p: Point): [Point, Vector][] {
        return this.vertexSharingPoints(p).map(q => [q, p.directionTo(q)]);
    }

    vertexSharingPoints(p: Point): Point[] {
        for (const rep of this.representatives) {
            const v = rep.center.directionTo(p);
            if (this.inBasis(v)) {
                return rep.vertexSharingPoints.map(p => p.translate(v));
            }
        }
        throw new Error("Point not in lattice: " + p);
    }

    vertices(p: Point) {
        for (const rep of this.representatives) {
            const v = rep.center.directionTo(p);
            if (this.inBasis(v)) {
                return rep.vertices.map(p => p.translate(v));
            }
        }
        throw new Error("Point not in lattice: " + p);
    }

    // Whether the line segment p1-p2 intersects the line segment q1-q2
    private intersect(p1: Point, p2: Point, q1: Point, q2: Point) {
        const [dp, dq] = [p1.directionTo(p2), q1.directionTo(q2)];
        return (
            p1.directionTo(q1).crossProduct(dp) * p1.directionTo(q2).crossProduct(dp) < 0 &&
            q1.directionTo(p1).crossProduct(dq) * q1.directionTo(p2).crossProduct(dq) < 0
        );
    }
}

class BearingImpl {
    constructor(private readonly lattice: LatticeImpl, private readonly v: Vector) {}

    eq(bearing: BearingImpl) {
        return this.v.eq(bearing.v);
    }

    from(p: Point) {
        return p.directionTo(this.next(p));
    }

    negate() {
        return new BearingImpl(this.lattice, this.v.negate());
    }

    next(p: Point) {
        for (const rep of this.lattice.representatives) {
            const w = rep.center.directionTo(p);
            if (this.lattice.inBasis(w)) {
                return rep.bearingNeighbors.get(this.v).translate(w);
            }
        }
    }

    toString() {
        return this.v.toString();
    }
}

export class Lattices {
    static RECTANGULAR = new LatticeImpl(
        { x1: 1, x2: 0, y2: 1 },
        [{ vertices: [new Point(-0.5, 0.5), new Point(-0.5, -0.5), new Point(0.5, -0.5), new Point(0.5, 0.5)] }],
        [
            // reflect X
            matrix([
                [-1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ]),
            // rotate 90º
            matrix([
                [0, -1, 0],
                [1, 0, 0],
                [0, 0, 1],
            ]),
        ],
        [new Vector(0, 1), new Vector(1, 0)]
    );

    static HEXAGONAL = new LatticeImpl(
        { x1: 2, x2: 1, y2: 3 },
        [
            {
                vertices: [
                    new Point(-1, 1),
                    new Point(-2, 0),
                    new Point(-1, -1),
                    new Point(1, -1),
                    new Point(2, 0),
                    new Point(1, 1),
                ],
            },
        ],
        [
            // reflect X
            matrix([
                [-1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ]),
            // rotate 60º
            matrix([
                [0.5, -0.5, 0],
                [1.5, 0.5, 0],
                [0, 0, 1],
            ]),
        ],
        [new Vector(0, 2), new Vector(3, 1), new Vector(3, -1)]
    );

    static TRIANGULAR = new LatticeImpl(
        { x1: 2, x2: 1, y2: 3 },
        [
            {
                vertices: [new Point(-2, 0), new Point(1, -1), new Point(1, 1)],
            },
            {
                vertices: [new Point(-2, 0), new Point(1, 1), new Point(-2, 2)],
            },
        ],
        [
            // reflect X about x=1
            matrix([
                [-1, 0, 2],
                [0, 1, 0],
                [0, 0, 1],
            ]),
            // rotate 60º about (1, 1)
            matrix([
                [0.5, -0.5, 0],
                [1.5, 0.5, -2],
                [0, 0, 1],
            ]),
        ],
        [new Vector(0, 2), new Vector(3, 1), new Vector(3, -1)]
    );

    static PYRAMID = new LatticeImpl(
        { x1: 2, x2: 1, y2: 2 },
        [
            {
                vertices: [
                    new Point(-1, 1),
                    new Point(-1, 0),
                    new Point(-1, -1),
                    new Point(1, -1),
                    new Point(1, 0),
                    new Point(1, 1),
                ],
            },
        ],
        [
            // reflect X
            matrix([
                [-1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ]),
            // rotate 180º
            matrix([
                [-1, 0, 0],
                [0, -1, 0],
                [0, 0, 1],
            ]),
        ],
        [new Vector(0, 2), new Vector(2, 1), new Vector(2, -1)]
    );

    static TETRAKIS_SQUARE = new LatticeImpl(
        { x1: 6, x2: 0, y2: 6 },
        [
            {
                vertices: [new Point(-1, 1), new Point(-1, -2), new Point(2, 1)],
            },
            {
                vertices: [new Point(-1, 4), new Point(-1, 1), new Point(2, 1)],
            },
            {
                vertices: [new Point(2, 4), new Point(2, 1), new Point(5, 4)],
            },
            {
                vertices: [new Point(2, 1), new Point(5, 1), new Point(5, 4)],
            },
            {
                vertices: [new Point(2, 1), new Point(5, -2), new Point(5, 1)],
            },
            {
                vertices: [new Point(-1, 4), new Point(2, 1), new Point(2, 4)],
            },
            {
                vertices: [new Point(2, 7), new Point(2, 4), new Point(5, 4)],
            },
            {
                vertices: [new Point(-1, 4), new Point(2, 4), new Point(2, 7)],
            },
        ],
        [
            // reflect X about x=1
            matrix([
                [-1, 0, 2],
                [0, 1, 0],
                [0, 0, 1],
            ]),
            // rotate 90º about (y=-1, 1)
            matrix([
                [0, -1, 0],
                [1, 0, -2],
                [0, 0, 1],
            ]),
        ],
        [new Vector(0, 1), new Vector(1, 0)]
    );

    static TRUNCATED_SQUARE = new LatticeImpl(
        { x1: 6, x2: 3, y2: 3 },
        [
            {
                vertices: [
                    new Point(-1, 2),
                    new Point(-2, 1),
                    new Point(-2, -1),
                    new Point(-1, -2),
                    new Point(1, -2),
                    new Point(2, -1),
                    new Point(2, 1),
                    new Point(1, 2),
                ],
            },
            {
                vertices: [new Point(-1, 4), new Point(-1, 2), new Point(1, 2), new Point(1, 4)],
            },
        ],
        [
            // reflect X
            matrix([
                [-1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ]),
            // rotate 90º
            matrix([
                [0, -1, 0],
                [1, 0, 0],
                [0, 0, 1],
            ]),
        ],
        [new Vector(0, 1), new Vector(1, 0)]
    );

    static SNUB_SQUARE = new LatticeImpl(
        { x1: 28, x2: 14, y2: 14 },
        [
            {
                vertices: [new Point(-7, 2), new Point(-2, -7), new Point(7, -2), new Point(2, 7)],
            },
            {
                vertices: [new Point(-7, 12), new Point(-7, 2), new Point(2, 7)],
            },
            {
                vertices: [new Point(2, 7), new Point(7, -2), new Point(12, 7)],
            },
            {
                vertices: [new Point(7, 16), new Point(2, 7), new Point(12, 7)],
            },
            {
                vertices: [new Point(-2, 21), new Point(-7, 12), new Point(2, 7), new Point(7, 16)],
            },
            {
                vertices: [new Point(-16, 7), new Point(-7, 2), new Point(-7, 12)],
            },
        ],
        [
            // reflect X about x=7
            matrix([
                [-1, 0, 14],
                [0, 1, 0],
                [0, 0, 1],
            ]),
            // rotate 90º
            matrix([
                [0, -1, 0],
                [1, 0, 0],
                [0, 0, 1],
            ]),
        ],
        [new Vector(1, 1), new Vector(1, -1)]
    );

    static CAIRO_PENTAGONAL = new LatticeImpl(
        { x1: 28, x2: 14, y2: 14 },
        [
            {
                vertices: [new Point(-2, 7), new Point(-6, 0), new Point(-2, -7), new Point(5, -3), new Point(5, 3)],
            },
            {
                vertices: [new Point(-9, 11), new Point(-16, 7), new Point(-12, 0), new Point(-6, 0), new Point(-2, 7)],
            },
            {
                vertices: [new Point(2, 14), new Point(-2, 7), new Point(5, 3), new Point(12, 7), new Point(8, 14)],
            },
            {
                vertices: [new Point(-9, 17), new Point(-9, 11), new Point(-2, 7), new Point(2, 14), new Point(-2, 21)],
            },
        ],
        [
            // reflect X
            matrix([
                [-1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ]),
            // rotate 90º about (y=-2, 7)
            matrix([
                [0, -1, 5],
                [1, 0, -9],
                [0, 0, 1],
            ]),
        ],
        [new Vector(1, 1), new Vector(1, -1)]
    );
}
