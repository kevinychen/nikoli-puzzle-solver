/**
 * Utilities for converting a Penpa URL to our own Puzzle object, and vice versa.
 */

import { range } from "lodash";
import { deflateRaw, inflateRaw } from "pako";
import { Lattice, Lattices, Point, PointSet, Puzzle, Solution, Symbol, ValueMap, ValueSet, Vector } from "../lib/";

/** JSON representation of the Problem or Solution in Penpa */
interface PenpaPart {
    arrows?: number[][];
    direction: any[];
    killercages?: number[][];
    line?: { [key: string]: number };
    lineE?: { [key: string]: number };
    number?: { [key: string]: [string, number, string] };
    numberS?: { [key: string]: [string, number] };
    squareframe: any[];
    surface?: { [key: string]: number };
    symbol?: { [key: string]: [number | number[], string, number] };
    thermo?: number[][];
    wall?: { [key: string]: number };
}

interface Penpa {
    parameters?: string;
    serializedPenpaParts: string[];
    lattice: Lattice;
    width: number;
    height: number;
    w: number;
    h: number;
    v: Vector;
}

enum Category {
    CELL,
    EDGE,
    VERTEX,
}

export function fromPenpaUrl(url: string, parameters: string): Penpa {
    const string = atob(url.substring(PENPA_PREFIX.length));
    const serializedPenpaParts = new TextDecoder()
        .decode(inflateRaw(Uint8Array.from(range(string.length).map(i => string.charCodeAt(i)))))
        .split("\n");
    const header = serializedPenpaParts[0].split(",");

    let width = parseInt(header[1]);
    let height = parseInt(header[2]);
    let v = new Vector(0, 0);

    let lattice, w, h;
    switch (header[0]) {
        case "square":
        case "sudoku":
        case "kakuro":
            lattice = Lattices.RECTANGULAR;
            w = width + 4;
            h = height + 4;
            let [topSpace, bottomSpace, leftSpace, rightSpace] = JSON.parse(serializedPenpaParts[1]);
            width -= leftSpace + rightSpace;
            height -= topSpace + bottomSpace;
            // Penpa uses (2,2) for the top-left square; we translate to (0,0) for convenience
            v = new Vector(2 + topSpace, 2 + leftSpace);
            break;
        case "hex":
            lattice = Lattices.HEXAGONAL;
            w = width * 3 + 1;
            h = height * 3 + 1;
            width = 2 * width + 1;
            height = 2 * height + 1;
            break;
        case "tri":
            lattice = Lattices.TRIANGULAR;
            w = div(width * 4, 3) + 4;
            h = div(height * 4, 3) + 4;
            width = 2 * width + 1;
            height = 2 * height + 1;
            break;
        case "pyramid":
            lattice = Lattices.PYRAMID;
            w = width + 4;
            h = height + 4;
            break;
        case "tetrakis_square":
            lattice = Lattices.TETRAKIS_SQUARE;
            h = height + 1;
            width *= 4;
            height *= 4;
            break;
        case "truncated_square":
            lattice = Lattices.TRUNCATED_SQUARE;
            w = width + 2;
            width *= 2;
            height *= 2;
            break;
        case "snub_square":
            lattice = Lattices.SNUB_SQUARE;
            w = width + 2;
            width *= 2;
            height *= 2;
            break;
        case "cairo_pentagonal":
            lattice = Lattices.CAIRO_PENTAGONAL;
            w = width + 2;
            width *= 2;
            height *= 2;
            break;
        default:
            throw new Error("Board type not supported");
    }

    return {
        parameters,
        serializedPenpaParts,
        lattice,
        width,
        height,
        w,
        h,
        v,
    };
}

export function toPuzzle(penpa: Penpa): Puzzle {
    const { parameters, serializedPenpaParts, lattice, width, height, w, h, v } = penpa;

    // Penpa encodes every item's (cell, edge, or vertex) coordinates by a single integer; this function does the reverse.
    function fromIndex(index: number) {
        let type: number, y, x, p;
        if (lattice === Lattices.RECTANGULAR) {
            type = div(index, w * h);
            [y, x] = [div(index % (w * h), w), (index % (w * h)) % w];
            p = new Point(y, x);
        } else if (lattice === Lattices.HEXAGONAL || lattice === Lattices.TRIANGULAR) {
            type = div(index, w * h);
            [y, x] = [div(index % (w * h), w), (index % (w * h)) % w];
            p = new Point(3 * y, 2 * x + (y % 2));
        } else if (lattice === Lattices.PYRAMID) {
            if (index >= 4 * w * h) {
                type = 4 + (index % 2);
                [y, x] = [div(div(index - 4 * w * h, 2), w), div(index - 4 * w * h, 2) % w];
            } else {
                type = div(index, w * h);
                [y, x] = [div(index % (w * h), w), (index % (w * h)) % w];
            }
            p = new Point(2 * y, 2 * x + (y % 2));
        } else if (lattice === Lattices.TETRAKIS_SQUARE) {
            type = index % 60;
            [x, y] = [div(div(index, 60), h), div(index, 60) % h];
            p = new Point(6 * y, 6 * x);
        } else if (lattice === Lattices.TRUNCATED_SQUARE) {
            type = index % 26;
            [y, x] = [div(div(index, 26), w), div(index, 26) % w];
            p = new Point(3 * y, 6 * x + (y % 2) * 3);
        } else if (lattice === Lattices.SNUB_SQUARE || lattice === Lattices.CAIRO_PENTAGONAL) {
            type = index % 46;
            [y, x] = [div(div(index, 46), w), div(index, 46) % w];
            p = new Point(14 * (y - x), 14 * (x + y));
        }
        let [_, offset, category] = types(lattice).find(([otherType]) => type === otherType);
        p = p.translate(offset);
        return { p: p.translate(v.negate()), category };
    }

    const puzzle: Puzzle = Object.assign(new Puzzle(), {
        lattice,
        width,
        height,
        points: new PointSet(
            lattice,
            JSON.parse(serializedPenpaParts[5])
                .map(
                    (
                        sum => (value: number) =>
                            (sum += value)
                    )(0)
                )
                .map((index: number) => fromIndex(index).p)
        ),
        parameters: Object.fromEntries(
            (parameters || "")
                .split("\n")
                .filter(line => line.includes(":"))
                .map(line => {
                    const index = line.indexOf(":");
                    return [line.substring(0, index), line.substring(index + 1)].map(s => s.trim());
                })
        ),
        shaded: new ValueMap([]),
        texts: new ValueMap([]),
        symbols: new ValueMap([]),
        edgeTexts: new ValueMap([]),
        borders: new ValueSet([]),
        junctionTexts: new ValueMap([]),
        junctionSymbols: new ValueMap([]),
        lines: new ValueSet([]),
        walls: new ValueSet([]),
        arrows: [],
        cages: [],
        thermo: [],
    });

    const q = JSON.parse(
        PENPA_ABBREVIATIONS.reduce((s, [a, b]) => s.replace(new RegExp(b, "g"), a), serializedPenpaParts[3])
    ) as PenpaPart;

    for (const arrow of q.arrows || []) {
        if (arrow) {
            puzzle.arrows.push(arrow.map(index => fromIndex(index).p));
        }
    }

    for (const cage of q.killercages || []) {
        if (cage) {
            puzzle.cages.push(cage.map(index => fromIndex(index).p));
        }
    }

    for (const thermo of q.thermo || []) {
        if (thermo) {
            puzzle.thermo.push(thermo.map(index => fromIndex(index).p));
        }
    }

    for (const [index] of Object.entries(q.line || {})) {
        let [{ p }, { p: q }] = index.split(",").map(s => fromIndex(parseInt(s)));
        puzzle.lines.add([p, q]).add([q, p]);
    }

    for (const [index] of Object.entries(q.lineE || {})) {
        let [{ p }, { p: q }] = index.split(",").map(s => fromIndex(parseInt(s)));
        [p, q] = lattice.cellsWithEdge(Point.center(p, q));
        puzzle.borders.add([p, q]).add([q, p]);
    }

    for (const [index, [text]] of Object.entries(q.number || {})) {
        if (text === "") {
            continue;
        }
        const { p, category } = fromIndex(parseInt(index));
        if (category === Category.CELL) {
            puzzle.texts.set(p, text);
        } else if (category === Category.EDGE) {
            puzzle.junctionTexts.set(new ValueSet(lattice.cellsWithEdge(p)), text);
        } else if (category === Category.VERTEX) {
            puzzle.junctionTexts.set(new ValueSet(lattice.cellsWithVertex(p)), text);
        }
    }

    for (const [index, [text]] of Object.entries(q.numberS || {})) {
        let { p, category } = fromIndex(div(parseInt(index), 4));
        let v;
        if (category === Category.EDGE) {
            p = p.translate(new Vector(-0.5, -0));
            v = [Vector.N, Vector.E, Vector.W, Vector.S][parseInt(index) % 4];
        } else if (category === Category.VERTEX) {
            p = p.translate(new Vector(-0.5, -0.5));
            v = [Vector.NW, Vector.NE, Vector.SW, Vector.SE][parseInt(index) % 4];
        }
        puzzle.edgeTexts.set([p, v], text.trim());
    }

    for (const [index, surface] of Object.entries(q.surface || {})) {
        puzzle.shaded.set(fromIndex(parseInt(index)).p, surface);
    }

    for (const [index, [style, shape]] of Object.entries(q.symbol || {})) {
        const { p, category } = fromIndex(parseInt(index));
        const symbol = new Symbol(shape, style);
        if (category === Category.CELL) {
            puzzle.symbols.set(p, symbol);
        } else if (category === Category.EDGE) {
            puzzle.junctionSymbols.set(new ValueSet(lattice.cellsWithEdge(p)), symbol);
        } else if (category === Category.VERTEX) {
            puzzle.junctionSymbols.set(new ValueSet(lattice.cellsWithVertex(p)), symbol);
        }
    }

    for (const [index] of Object.entries(q.wall || {})) {
        let [{ p }, { p: q }] = index.split(",").map(s => fromIndex(parseInt(s)));
        const cells = new ValueSet(lattice.cellsWithEdge(p));
        const base = lattice.cellsWithEdge(q).find(cell => cells.has(cell));
        puzzle.walls.add([base, base.directionTo(lattice.cellsWithEdge(p).find(cell => !cell.eq(base)))]);
        puzzle.walls.add([base, base.directionTo(lattice.cellsWithEdge(q).find(cell => !cell.eq(base)))]);
    }

    return puzzle;
}

export function newSolution(): Solution {
    return Object.assign(new Solution(), {
        shaded: new ValueSet([]),
        texts: new ValueMap([]),
        symbols: new ValueMap([]),
        edgeTexts: new ValueMap([]),
        borders: new ValueSet([]),
        lines: new ValueMap([]),
    });
}

export function toPenpaUrl(penpa: Penpa, solution: Solution): string {
    const { serializedPenpaParts, lattice, w, h, v } = penpa;

    const a: PenpaPart = {
        arrows: [],
        direction: [],
        killercages: [],
        line: {},
        lineE: {},
        number: {},
        numberS: {},
        squareframe: [],
        surface: {},
        symbol: {},
        thermo: [],
        wall: {},
    };

    // Do the reverse of fromIndex
    function toIndex(p: Point) {
        p = p.translate(v);
        const [type, offset] = types(lattice).find(([_, offset]) =>
            lattice.inBasis(new Vector(p.y - offset.dy, p.x - offset.dx))
        );
        p = p.translate(offset.negate());
        if (lattice === Lattices.RECTANGULAR) {
            const [y, x] = [p.y, p.x];
            return w * h * type + w * y + x;
        } else if (lattice === Lattices.HEXAGONAL || lattice === Lattices.TRIANGULAR) {
            const [y, x] = [div(p.y, 3), div(p.x, 2)];
            return w * h * type + w * y + x;
        } else if (lattice === Lattices.PYRAMID) {
            const [y, x] = [div(p.y, 2), div(p.x, 2)];
            return type >= 4 ? 4 * w * h + 2 * (w * y + x) + (type - 1) : w * h * type + w * y + x;
        } else if (lattice === Lattices.TETRAKIS_SQUARE) {
            const [y, x] = [div(p.y, 6), div(p.x, 6)];
            return 60 * (h * x + y) + type;
        } else if (lattice === Lattices.TRUNCATED_SQUARE) {
            const [y, x] = [div(p.y, 3), div(p.x, 6)];
            return 26 * (w * y + x) + type;
        } else if (lattice === Lattices.SNUB_SQUARE || lattice === Lattices.CAIRO_PENTAGONAL) {
            const [y, x] = [div(p.x + p.y, 28), div(p.x - p.y, 28)];
            return 46 * (w * y + x) + type;
        }
    }

    solution.shaded.forEach(p => (a.surface[toIndex(p)] = 1));

    solution.texts.forEach((text, p) => (a.number[toIndex(p)] = [text, 2, "1"]));

    solution.symbols.forEach(({ shape, style }, p) => (a.symbol[toIndex(p)] = [style, shape, 1]));

    solution.edgeTexts.forEach((text, [p, v]) => {
        let r = [Vector.N, Vector.E, Vector.W, Vector.S].findIndex(w => w.eq(v));
        if (r !== -1) {
            a.numberS[4 * toIndex(p.translate(new Vector(0.5, 0))) + r] = [text, 1];
        }
        r = [Vector.NW, Vector.NE, Vector.SW, Vector.SE].findIndex(w => w.eq(v));
        if (r !== -1) {
            a.numberS[4 * toIndex(p.translate(new Vector(0.5, 0.5))) + r] = [text, 1];
        }
    });

    solution.borders.forEach(([p, q]) => {
        [p, q] = lattice.edgeVertices(p, q);
        let [index1, index2] = [toIndex(p), toIndex(q)];
        if (index1 > index2) {
            [index1, index2] = [index2, index1];
        }
        a.lineE[`${index1},${index2}`] = 3;
    });

    solution.lines.forEach((shape, [p, q]) => {
        let [index1, index2] = [toIndex(p), toIndex(q)];
        if (index1 > index2) {
            [index1, index2] = [index2, index1];
        }
        a.line[`${index1},${index2}`] = shape === true ? 3 : shape;
    });

    serializedPenpaParts[4] = PENPA_ABBREVIATIONS.reduce(
        (s, [c, d]) => s.replace(new RegExp(c, "g"), d),
        JSON.stringify(a)
    );
    const string = serializedPenpaParts.join("\n");
    return PENPA_PREFIX + btoa(String.fromCodePoint.apply(null, deflateRaw(new TextEncoder().encode(string))));
}

const PENPA_PREFIX = "m=edit&p=";

// https://github.com/swaroopg92/penpa-edit/blob/v3.0.3/docs/js/class_p.js#L131-L162
const PENPA_ABBREVIATIONS = [
    ['"qa"', "z9"],
    ['"pu_q"', "zQ"],
    ['"pu_a"', "zA"],
    ['"grid"', "zG"],
    ['"edit_mode"', "zM"],
    ['"surface"', "zS"],
    ['"line"', "zL"],
    ['"lineE"', "zE"],
    ['"wall"', "zW"],
    ['"cage"', "zC"],
    ['"number"', "zN"],
    ['"symbol"', "zY"],
    ['"special"', "zP"],
    ['"board"', "zB"],
    ['"command_redo"', "zR"],
    ['"command_undo"', "zU"],
    ['"command_replay"', "z8"],
    ['"numberS"', "z1"],
    ['"freeline"', "zF"],
    ['"freelineE"', "z2"],
    ['"thermo"', "zT"],
    ['"arrows"', "z3"],
    ['"direction"', "zD"],
    ['"squareframe"', "z0"],
    ['"polygon"', "z5"],
    ['"deletelineE"', "z4"],
    ['"killercages"', "z6"],
    ['"nobulbthermo"', "z7"],
    ['"__a"', "z_"],
    ["null", "zO"],
];

/**
 * Returns the cells, edges, and vertices in a single fundamental domain for the given lattice,
 * and the vector from the base cell.
 * See ./public/docs.html for diagrams of the numerical values.
 */
function types(lattice: Lattice): [number, Vector, Category][] {
    switch (lattice) {
        case Lattices.RECTANGULAR:
            return [
                [0, new Vector(0, 0), Category.CELL],
                [1, new Vector(0.5, 0.5), Category.VERTEX],
                [2, new Vector(0.5, 0), Category.EDGE],
                [3, new Vector(0, 0.5), Category.EDGE],
            ];
        case Lattices.HEXAGONAL:
            return [
                [0, new Vector(0, 0), Category.CELL],
                [1, new Vector(2, 0), Category.VERTEX],
                [2, new Vector(1, -1), Category.VERTEX],
                [3, new Vector(1.5, -0.5), Category.EDGE],
                [4, new Vector(1.5, 0.5), Category.EDGE],
                [5, new Vector(0, 1), Category.EDGE],
            ];
        case Lattices.TRIANGULAR:
            return [
                [0, new Vector(-2, 0), Category.VERTEX],
                [1, new Vector(0, 0), Category.CELL],
                [2, new Vector(-1, -1), Category.CELL],
                [3, new Vector(-0.5, -0.5), Category.EDGE],
                [4, new Vector(-0.5, 0.5), Category.EDGE],
                [5, new Vector(-2, 1), Category.EDGE],
            ];
        case Lattices.PYRAMID:
            return [
                [0, new Vector(0, 0), Category.CELL],
                [1, new Vector(-1, 1), Category.VERTEX],
                [2, new Vector(1, 1), Category.VERTEX],
                [3, new Vector(0, 1), Category.EDGE],
                [4, new Vector(1, -0.5), Category.EDGE],
                [5, new Vector(1, 0.5), Category.EDGE],
            ];
        case Lattices.TETRAKIS_SQUARE:
            return [
                [0, new Vector(-1, -2), Category.VERTEX],
                [1, new Vector(-1, 1), Category.VERTEX],
                [2, new Vector(0, 0), Category.CELL],
                [10, new Vector(0, 2), Category.CELL],
                [15, new Vector(0.5, -0.5), Category.EDGE],
                [26, new Vector(-1, 2.5), Category.EDGE],
                [27, new Vector(0.5, 1), Category.EDGE],
                [28, new Vector(-1, -0.5), Category.EDGE],
                [29, new Vector(-2.5, 1), Category.EDGE],
                [30, new Vector(2, 1), Category.VERTEX],
                [31, new Vector(2, 4), Category.VERTEX],
                [32, new Vector(3, 3), Category.CELL],
                [33, new Vector(4, 2), Category.CELL],
                [34, new Vector(4, 0), Category.CELL],
                [39, new Vector(1, 3), Category.CELL],
                [40, new Vector(3, 5), Category.CELL],
                [43, new Vector(1, 5), Category.CELL],
                [45, new Vector(3.5, 2.5), Category.EDGE],
                [47, new Vector(3.5, -0.5), Category.EDGE],
                [51, new Vector(0.5, 2.5), Category.EDGE],
                [56, new Vector(3, 7.5), Category.EDGE],
                [57, new Vector(4.5, 6), Category.EDGE],
                [58, new Vector(3, 4.5), Category.EDGE],
                [59, new Vector(1.5, 6), Category.EDGE],
            ];
        case Lattices.TRUNCATED_SQUARE:
            return [
                [0, new Vector(0, 0), Category.CELL],
                [1, new Vector(0, 3), Category.CELL],
                [2, new Vector(1, 2), Category.VERTEX],
                [3, new Vector(2, 1), Category.VERTEX],
                [4, new Vector(2, -1), Category.VERTEX],
                [10, new Vector(1, 4), Category.VERTEX],
                [14, new Vector(0, 2), Category.EDGE],
                [15, new Vector(1.5, 1.5), Category.EDGE],
                [16, new Vector(2, 0), Category.EDGE],
                [17, new Vector(1.5, -1.5), Category.EDGE],
                [22, new Vector(0, 4), Category.EDGE],
                [23, new Vector(1, 3), Category.EDGE],
            ];
        case Lattices.SNUB_SQUARE:
            return [
                [0, new Vector(0, 0), Category.CELL],
                [1, new Vector(-4, 7), Category.CELL],
                [2, new Vector(7, 4), Category.CELL],
                [3, new Vector(7, 10), Category.CELL],
                [4, new Vector(0, 14), Category.CELL],
                [5, new Vector(-10, 7), Category.CELL],
                [6, new Vector(2, 7), Category.VERTEX],
                [10, new Vector(-7, 12), Category.VERTEX],
                [12, new Vector(7, 16), Category.VERTEX],
                [19, new Vector(-2, 21), Category.VERTEX],
                [26, new Vector(-2.5, 4.5), Category.EDGE],
                [27, new Vector(4.5, 2.5), Category.EDGE],
                [30, new Vector(-2.5, 9.5), Category.EDGE],
                [31, new Vector(7, 7), Category.EDGE],
                [32, new Vector(9.5, 11.5), Category.EDGE],
                [36, new Vector(-7, 7), Category.EDGE],
                [38, new Vector(4.5, 11.5), Category.EDGE],
                [39, new Vector(2.5, 18.5), Category.EDGE],
                [42, new Vector(-4.5, 16.5), Category.EDGE],
                [43, new Vector(-11.5, 9.5), Category.EDGE],
            ];
        case Lattices.CAIRO_PENTAGONAL:
            return [
                [0, new Vector(-2, -7), Category.VERTEX],
                [1, new Vector(-6, 0), Category.VERTEX],
                [2, new Vector(5, -3), Category.VERTEX],
                [3, new Vector(5, 3), Category.VERTEX],
                [4, new Vector(-2, 7), Category.VERTEX],
                [5, new Vector(-12, 0), Category.VERTEX],
                [6, new Vector(0, 0), Category.CELL],
                [10, new Vector(-9, 5), Category.CELL],
                [12, new Vector(5, 9), Category.CELL],
                [19, new Vector(-4, 14), Category.CELL],
                [26, new Vector(-4, -3.5), Category.EDGE],
                [27, new Vector(1.5, -5), Category.EDGE],
                [30, new Vector(-4, 3.5), Category.EDGE],
                [31, new Vector(5, 0), Category.EDGE],
                [32, new Vector(8.5, 5), Category.EDGE],
                [36, new Vector(-9, 0), Category.EDGE],
                [38, new Vector(1.5, 5), Category.EDGE],
                [39, new Vector(0, 10.5), Category.EDGE],
                [42, new Vector(-5.5, 9), Category.EDGE],
                [43, new Vector(-14, 3.5), Category.EDGE],
            ];
    }
}

function div(a: number, b: number) {
    return Math.floor(a / b);
}
