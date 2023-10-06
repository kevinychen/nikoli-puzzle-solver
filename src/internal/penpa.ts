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

export function fromPenpaUrl(url: string, parameters: string): Penpa {
    const string = atob(url.substring(PENPA_PREFIX.length));
    const serializedPenpaParts = new TextDecoder()
        .decode(inflateRaw(Uint8Array.from(range(string.length).map(i => string.charCodeAt(i)))))
        .split("\n");
    const header = serializedPenpaParts[0].split(",");

    let lattice: Lattice, topSpace, bottomSpace, leftSpace, rightSpace, width, height, w: number, h: number, v: Vector;

    switch (header[0]) {
        case "square":
        case "sudoku":
        case "kakuro":
            lattice = Lattices.RECTANGULAR;
            [topSpace, bottomSpace, leftSpace, rightSpace] = JSON.parse(serializedPenpaParts[1]);
            width = parseInt(header[1]) - leftSpace - rightSpace;
            height = parseInt(header[2]) - topSpace - bottomSpace;
            w = width + 4 + leftSpace + rightSpace;
            h = height + 4 + topSpace + bottomSpace;
            // Penpa uses (2,2) for the top-left square; we translate to (0,0) for convenience
            v = new Vector(2 + topSpace, 2 + leftSpace);
            break;
        case "hex":
            lattice = Lattices.HEXAGONAL;
            topSpace = bottomSpace = leftSpace = rightSpace = JSON.parse(serializedPenpaParts[1]) * 4;
            width = parseInt(header[1]);
            height = parseInt(header[2]);
            w = width * 3 + 1;
            h = height * 3 + 1;
            v = new Vector(0, 0);
            break;
        case "tri":
            lattice = Lattices.TRIANGULAR;
            topSpace = bottomSpace = leftSpace = rightSpace = JSON.parse(serializedPenpaParts[1]) * 4;
            width = parseInt(header[1]);
            height = parseInt(header[2]);
            w = div(width * 4 + 11, 3);
            h = div(height * 4 + 11, 3);
            v = new Vector(0, 0);
            break;
        default:
            throw new Error();
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

    /** Penpa encodes every cell's coordinates by a single integer; this function does the reverse. */
    function fromIndex(index: number) {
        let category = div(index, w * h);
        const num = index % (w * h);
        let p = new Point(div(num, w), num % w);
        if (lattice === Lattices.HEXAGONAL) {
            // change from odd-r offset coordinates to triple-y doubled coordinates
            p = new Point(3 * p.y, 2 * p.x + (p.y % 2));
        } else if (lattice === Lattices.TRIANGULAR) {
            p = new Point(3 * p.y, 2 * p.x + (p.y % 2));
            if (category === 0) {
                p = p.translate(new Vector(-2, 0));
            } else if (category === 2) {
                p = p.translate(new Vector(-1, -1));
            }
            category = 0;
        }
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

    for (const [index, _] of Object.entries(q.lineE || {})) {
        let [{ p, category }, { p: q }] = index.split(",").map(s => fromIndex(parseInt(s)));
        if (lattice === Lattices.RECTANGULAR) {
            // An edge is labeled by its two endpoints. Each endpoint vertex is labeled by the
            // coordinate of the square with it as its bottom right corner. So it is at (y+.5,x+.5),
            // but we double the coordinates so that we work in integers. We then rotate the
            // difference vector about one of its endpoints by ±45º (with a scale factor of 1/√2,
            // or 1/2 since we're in doubled space) to get the squares on both sides.
            p = new Point(2 * p.y + 1, 2 * p.x + 1);
            q = new Point(2 * q.y + 1, 2 * q.x + 1);
            const dy = q.y - p.y;
            const dx = q.x - p.x;
            [p, q] = [
                new Point(div(p.y + div(dy - dx, 2), 2), div(p.x + div(dy + dx, 2), 2)),
                new Point(div(p.y + div(dy + dx, 2), 2), div(p.x + div(-dy + dx, 2), 2)),
            ];
        } else if (lattice === Lattices.HEXAGONAL) {
            // For the hexagonal grid, each vertex is labeled by the hexagon that has it as either
            // its bottom corner or bottom left corner. So they are at (y+1,x-1) and (y+2,x) in
            // doubled coordinates.
            // Each edge connects one vertex of each category, and if the vertex with the second
            // category is given first, we swap them first for convenience. Everything else is the
            // same, just with a different rotation angle and scale factor.
            if (category === 1) {
                [p, q] = [q, p];
            }
            p = new Point(p.y + 1, p.x - 1);
            q = new Point(q.y + 2, q.x);
            const dy = q.y - p.y;
            const dx = q.x - p.x;
            [p, q] = [
                new Point(p.y + div(dy - 3 * dx, 2), p.x + div(dy + dx, 2)),
                new Point(p.y + div(dy + 3 * dx, 2), p.x + div(-dy + dx, 2)),
            ];
        } else if (lattice === Lattices.TRIANGULAR) {
            // For the triangular grid, consider the hexagonal lattice consisting of the regular
            // hexagon inscribed in each triangle, and the remaining "holes" to fill the remaining
            // holes. Each vertex is labeled by the hexagon in the hole.
            const dy = q.y - p.y;
            const dx = q.x - p.x;
            [p, q] = [
                new Point(p.y + div(dy - dx, 2), p.x + div(dy + 3 * dx, 6)),
                new Point(p.y + div(dy + dx, 2), p.x + div(-dy + 3 * dx, 6)),
            ];
        }
        puzzle.borders.add([p, q]).add([q, p]);
    }

    for (const [index, [text, _, __]] of Object.entries(q.number || {})) {
        if (text === "") {
            continue;
        }
        const { p, category } = fromIndex(parseInt(index));
        if (category === 0) {
            puzzle.texts.set(p, text);
        } else if (category === 1) {
            const regions = [p, p.translate(Vector.E), p.translate(Vector.S), p.translate(Vector.SE)];
            puzzle.junctionTexts.set(new ValueSet(regions), text);
        } else if (category === 2) {
            const regions = [p, p.translate(Vector.S)];
            puzzle.junctionTexts.set(new ValueSet(regions), text);
        } else if (category === 3) {
            const regions = [p, p.translate(Vector.E)];
            puzzle.junctionTexts.set(new ValueSet(regions), text);
        }
    }

    for (const [index, [text, _]] of Object.entries(q.numberS || {})) {
        const { p, category } = fromIndex(div(parseInt(index), 4));
        const v = (
            category === 2 ? [Vector.N, Vector.E, Vector.W, Vector.S] : [Vector.NW, Vector.NE, Vector.SW, Vector.SE]
        )[parseInt(index) % 4];
        puzzle.edgeTexts.set([p, v], text.trim());
    }

    for (const [index, surface] of Object.entries(q.surface || {})) {
        puzzle.shaded.set(fromIndex(parseInt(index)).p, surface);
    }

    for (const [index, [style, shape, _]] of Object.entries(q.symbol || {})) {
        const { p, category } = fromIndex(parseInt(index));
        const symbol = new Symbol(shape, style);
        if (category === 0) {
            puzzle.symbols.set(p, symbol);
        } else if (category === 1) {
            const regions = [p, p.translate(Vector.E), p.translate(Vector.S), p.translate(Vector.SE)];
            puzzle.junctionSymbols.set(new ValueSet(regions), symbol);
        } else if (category === 2) {
            const regions = [p, p.translate(Vector.S)];
            puzzle.junctionSymbols.set(new ValueSet(regions), symbol);
        } else if (category === 3) {
            const regions = [p, p.translate(Vector.E)];
            puzzle.junctionSymbols.set(new ValueSet(regions), symbol);
        }
    }

    for (const [index, _] of Object.entries(q.wall || {})) {
        let [{ p, category }, _] = index.split(",").map(s => fromIndex(parseInt(s)));
        if (category === 2) {
            puzzle.walls.add([p.translate(Vector.S), Vector.N]).add([p.translate(Vector.S), Vector.S]);
        } else if (category === 3) {
            puzzle.walls.add([p.translate(Vector.E), Vector.W]).add([p.translate(Vector.E), Vector.E]);
        }
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

    function toIndex(p: Point, category = 0) {
        let { y, x } = p.translate(v);
        if (lattice === Lattices.HEXAGONAL) {
            // change from triple-y doubled coordinates to odd-r offset coordinates
            y = div(y, 3);
            x = div(x, 2);
        } else if (lattice === Lattices.TRIANGULAR) {
            category = (4 - (y % 3)) % 3;
            y = div(y + 2, 3);
            x = div(x + 1 - (y % 2), 2);
        }
        return w * h * category + w * y + x;
    }

    solution.shaded.forEach(p => (a.surface[toIndex(p)] = 1));

    solution.texts.forEach((text, p) => (a.number[toIndex(p)] = [text, 2, "1"]));

    solution.symbols.forEach(({ shape, style }, p) => (a.symbol[toIndex(p)] = [style, shape, 1]));

    solution.edgeTexts.forEach((text, [p, v]) => {
        let r = [Vector.N, Vector.E, Vector.W, Vector.S].findIndex(w => w.eq(v));
        if (r !== -1) {
            a.numberS[4 * toIndex(p, 2) + r] = [text, 1];
        }
        r = [Vector.NW, Vector.NE, Vector.SW, Vector.SE].findIndex(w => w.eq(v));
        if (r !== -1) {
            a.numberS[4 * toIndex(p, 1) + r] = [text, 1];
        }
    });

    solution.borders.forEach(([p, q]) => {
        const dy = q.y - p.y;
        const dx = q.x - p.x;
        // Do the reverse of the transformations of lineE done in toPuzzle.
        let index1, index2;
        if (lattice === Lattices.RECTANGULAR) {
            [p, q] = [new Point(2 * p.y + dy - dx, 2 * p.x + dy + dx), new Point(2 * p.y + dy + dx, 2 * p.x - dy + dx)];
            index1 = toIndex(new Point(div(p.y, 2), div(p.x, 2)), 1);
            index2 = toIndex(new Point(div(q.y, 2), div(q.x, 2)), 1);
        } else if (lattice === Lattices.HEXAGONAL) {
            [p, q] = [
                new Point(p.y + div(dy - dx, 2), p.x + div(div(dy, 3) + dx, 2)),
                new Point(p.y + div(dy + dx, 2), p.x + div(-div(dy, 3) + dx, 2)),
            ];
            if (p.y % 3 != 1) {
                [p, q] = [q, p];
            }
            index1 = toIndex(new Point(p.y, p.x + 1), 2);
            index2 = toIndex(new Point(q.y, q.x), 1);
        } else if (lattice === Lattices.TRIANGULAR) {
            [p, q] = [
                new Point(p.y + div(dy - 3 * dx, 2), p.x + div(dy + dx, 2)),
                new Point(p.y + div(dy + 3 * dx, 2), p.x + div(-dy + dx, 2)),
            ];
            index1 = toIndex(p, 0);
            index2 = toIndex(q, 0);
        }
        if (index1 > index2) {
            [index1, index2] = [index2, index1];
        }
        a.lineE[`${index1},${index2}`] = 3;
    });

    solution.lines.forEach((shape, [p, q]) => {
        let index1 = toIndex(p);
        let index2 = toIndex(q);
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

function div(a: number, b: number) {
    return Math.floor(a / b);
}
