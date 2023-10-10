import { ValueMap, ValueSet } from "./collections";
import { Lattice } from "./geometry/lattice";
import { Point } from "./geometry/point";
import { PointSet } from "./geometry/pointset";
import { Vector } from "./geometry/vector";
import { Symbol } from "./symbol";
import { UnionFind } from "./unionfind";

/**
 * The framework will construct this object based on the contents of the Penpa grid.
 * Each puzzle solver can use these values as the puzzle input.
 */
export class Puzzle {
    lattice: Lattice;
    width: number;
    height: number;
    points: PointSet;
    parameters: { [key: string]: string };

    /** All shaded points, texts, and symbols. */
    shaded: ValueMap<Point, number>;
    texts: ValueMap<Point, string>;
    symbols: ValueMap<Point, Symbol>;

    /**
     * Text on an edge, for example ((y,x), NE) is the text in the top right corner of (y, x).
     */
    edgeTexts: ValueMap<[Point, Vector], string>;

    /**
     * Contains a set of two points (p,q) if there is a line between p and q. For convenience, in
     * the given puzzle, both (p,q) and (q,p) will be present, but only one of them needs to be set
     * in the solution.
     */
    borders: ValueSet<[Point, Point]>;

    /**
     * Any value (text or symbol) between cells in the grid. For example, a key of 2 cells
     * corresponds to a value between them. A key of more than 2 cells is a vertex, e.g. each
     * corner of a square grid is a junction of 4 cells.
     */
    junctionTexts: ValueMap<ValueSet<Point>, string>;
    junctionSymbols: ValueMap<ValueSet<Point>, Symbol>;

    /**
     * Contains a set of two points (p,q) if there is a line from p to q. For convenience, in the
     * given puzzle, both (p,q) and (q,p) will be present, but only one of them needs to be set in
     * the solution.
     */
    lines: ValueSet<[Point, Point]>;

    /**
     * A wall at point p going in both the given direction and the opposite direction (both will
     * be present)
     */
    walls: ValueSet<[Point, Vector]>;

    /**
     * Objects used in Sudoku variants. Each list of points represents an arrow, cage, or
     * thermometer.
     */
    arrows: Point[][];
    cages: Point[][];
    thermo: Point[][];

    /**
     * @returns all Point[] of unshaded cells that are bounded by either shaded cells or border
     * edges.
     */
    regions(): Point[][] & { get: (p: Point) => Point[] } {
        const uf = new UnionFind<Point>();
        for (const [p, q] of this.points.edges()) {
            if (!this.shaded.has(p) && !this.shaded.has(q) && !this.borders.has([p, q])) {
                uf.union(p, q);
            }
        }
        const regions = [...this.points]
            .filter(p => !this.shaded.has(p))
            .filter(p => uf.find(p).eq(p))
            .map(p => [...this.points].filter(q => uf.find(q).eq(p)));
        return Object.assign(regions, {
            get: (p: Point) => {
                return regions.find(region => region.some(q => p.eq(q)));
            },
        });
    }
}
