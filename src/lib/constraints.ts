import { isEqual, range } from "lodash";
import { Arith, Bool, Solver } from "z3-solver";
import { ValueMap, ValueSet } from "./collections";
import { Bearing } from "./geometry/bearing";
import { Lattice } from "./geometry/lattice";
import { Point } from "./geometry/point";
import { PointSet } from "./geometry/pointset";
import { Vector } from "./geometry/vector";
import { LoopNetwork, Network, PathNetwork } from "./network";
import { Context } from "./solver";

export type ChoiceArith<T> = Arith & {
    is(val: T): Bool;
};

export type NetworkArith = Arith & {
    hasDirection(v: Vector): Bool;
    is(vs: Vector[]): Bool;
    isLoopSegment(): Bool;
    isStraight(): Bool;
    isTerminal(): Bool;
};

export interface Model {
    get(arith: Arith): number;
}

export interface Constraints {
    /** Creates a new variable that can take any integer value within the given bounds. */
    int(minInclusive?: number, maxInclusive?: number): Arith;

    /** Creates a new variable that can take any of the given values, or none of them (-1). */
    choice<V>(values: Iterable<V>): ChoiceArith<V>;

    /**
     * Returns a grid of variables that forms a valid network, e.g. if a cell goes right, then
     * the cell to its right also goes left. Each cell is a valid component of the given network.
     */
    NetworkGrid(points: PointSet, network: Network): ValueMap<Point, NetworkArith>;

    /**
     * Returns a valid network grid consisting of and only of non-intersecting paths.
     * @returns [network, grid, order] where order is -1 where there is no path, otherwise starts
     * from 0 and increments by 1 until the end.
     */
    PathsGrid(points: PointSet): [Network, ValueMap<Point, NetworkArith>, ValueMap<Point, Arith>];

    /**
     * Returns a valid network grid consisting of a single connected loop.
     * @returns [network, grid, root] where root is an arbitrary start point on the loop.
     */
    SingleLoopGrid(points: PointSet): [Network, ValueMap<Point, NetworkArith>, ChoiceArith<Point>];

    /** Adds the given constraints. */
    add(...exprs: Bool[]): void;

    /** Adds a constraint that all "good" points are orthogonally connected. */
    addAllConnected(points: PointSet, good: (p: Point) => Bool): void;

    /** Adds a constraint that all points are orthogonally connected along edges to one of the roots. */
    addConnected(
        points: PointSet,
        isRoot: (p: Point) => boolean | Bool,
        isEdge: (p: Point, q: Point) => boolean | Bool
    ): ValueMap<Point, ChoiceArith<Point>>;

    /**
     * Returns a variable representing the number of orthogonally connected points within the given
     * distance (inclusive) of the start point.
     */
    addContiguousArea(lattice: Lattice, points: PointSet, start: Point, good: (p: Point) => Bool, area: number): void;

    /** Adds a constraint that the contiguous sums of the given values (separated by 0) must have the given sums */
    addContiguousBlockSums(line: Arith[], sums: string[]): void;

    /** Adds a constraint that the orthogonally connected "good" points in straight lines have the given count. */
    addSightLineCount(
        lattice: Lattice,
        points: PointSet,
        start: Point,
        good: (p: Point, bearing?: Bearing) => Bool,
        count: number
    ): void;

    /**
     * Given the variables that we care about, returns the values for the variables that satisfy all added constraints.
     */
    solve(ariths: Iterable<[any, Arith]>): Promise<Model>;
}

export class ConstraintsImpl implements Constraints {
    constructor(
        private readonly differentFrom: ValueMap<any, number>,
        private readonly context: Context,
        private readonly solver: Solver,
        private readonly setValues: (values: ValueMap<any, number>) => void
    ) {}

    int(minInclusive?: number, maxInclusive?: number) {
        const arith = this.context.Int.const(crypto.randomUUID());
        if (minInclusive !== undefined) {
            this.solver.add(arith.ge(minInclusive));
        }
        if (maxInclusive !== undefined) {
            this.solver.add(arith.le(maxInclusive));
        }
        return arith;
    }

    choice<V>(valuesIt: Iterable<V>) {
        const values = [...valuesIt];
        return Object.assign(this.int(-1, values.length - 1), {
            is(val: V): Bool {
                return this.eq(values.findIndex(otherVal => isEqual(val, otherVal)));
            },
        });
    }

    NetworkGrid(points: PointSet, network: Network) {
        const { Implies, Or } = this.context;
        const grid = new ValueMap(points, p => {
            const directionSets = network.directionSets(p);
            const getIndices = (predicate: (vs: Vector[]) => Boolean) =>
                range(directionSets.length).filter(i => predicate(directionSets[i]));
            return Object.assign(this.int(0, network.directionSets(p).length - 1), {
                hasDirection(v: Vector) {
                    return Or(...getIndices(vs => vs.some(w => w.eq(v))).map(i => this.eq(i)));
                },
                is(vs: Vector[]) {
                    return Or(...getIndices(ws => isEqual(ws, vs.sort())).map(i => this.eq(i)));
                },
                isLoopSegment() {
                    return Or(...getIndices(vs => vs.length === 2).map(i => this.eq(i)));
                },
                isStraight() {
                    return Or(
                        ...getIndices(vs =>
                            points.lattice
                                .edgeSharingDirections(p)
                                .every(v => vs.some(w => w.eq(v)) === vs.some(w => w.eq(v.negate())))
                        ).map(i => this.eq(i))
                    );
                },
                isTerminal() {
                    return Or(...getIndices(vs => vs.length === 1).map(i => this.eq(i)));
                },
            });
        });
        for (const [p, arith] of grid) {
            for (const [q, v] of points.lattice.edgeSharingNeighbors(p)) {
                this.add(Implies(arith.hasDirection(v), grid.get(q)?.hasDirection(v.negate()) || false));
            }
        }
        return grid;
    }

    PathsGrid(points: PointSet): [Network, ValueMap<Point, NetworkArith>, ValueMap<Point, Arith>] {
        const { And, If, Implies, Or } = this.context;
        const network = new PathNetwork(points.lattice);
        const grid = this.NetworkGrid(points, network);
        const order = new ValueMap(points, _ => this.int());
        for (const [p, arith] of grid) {
            const hasNeighbor = (d: number) =>
                Or(
                    ...points
                        .edgeSharingNeighbors(p)
                        .map(([q, v]) => And(arith.hasDirection(v), order.get(q).eq(order.get(p).add(d))))
                );
            this.add(Implies(arith.isLoopSegment(), And(hasNeighbor(-1), hasNeighbor(1))));
            this.add(Implies(arith.isTerminal(), If(order.get(p).eq(0), hasNeighbor(1), hasNeighbor(-1))));
            this.add(Implies(arith.eq(0), order.get(p).eq(-1)));
        }
        return [network, grid, order];
    }

    SingleLoopGrid(points: PointSet): [Network, ValueMap<Point, NetworkArith>, ChoiceArith<Point>] {
        const { Or } = this.context;
        const network = new LoopNetwork(points.lattice);
        const grid = this.NetworkGrid(points, network);
        const root = this.choice(points);
        this.addConnected(
            points,
            p => Or(grid.get(p).eq(0), root.is(p)),
            (p, q) => grid.get(p).hasDirection(p.directionTo(q))
        );
        return [network, grid, root];
    }

    add(...exprs: Bool[]) {
        this.solver.add(...exprs);
    }

    addAllConnected(points: PointSet, good: (p: Point) => Bool) {
        const { And, Not, Or } = this.context;
        const tree = new ValueMap(points, _ => this.int());
        const root = this.choice(points);
        for (const p of points) {
            this.add(
                Or(
                    Not(good(p)),
                    root.is(p),
                    ...points.edgeSharingPoints(p).map(q => And(good(q), tree.get(q).lt(tree.get(p))))
                )
            );
        }
    }

    addConnected(
        points: PointSet,
        isRoot: (p: Point) => boolean | Bool,
        isEdge: (p: Point, q: Point) => boolean | Bool
    ) {
        const { And, If, Implies, Or } = this.context;
        const instance = new ValueMap(points, _ => this.choice(points));
        const tree = new ValueMap(points, _ => this.int());
        for (const p of points) {
            this.add(
                If(
                    isRoot(p),
                    instance.get(p).is(p),
                    Or(...points.edgeSharingPoints(p).map(q => And(isEdge(p, q), tree.get(q).lt(tree.get(p)))))
                )
            );
            for (const q of points.edgeSharingPoints(p)) {
                this.add(Implies(isEdge(p, q), instance.get(p).eq(instance.get(q))));
            }
        }
        return instance;
    }

    addContiguousArea(lattice: Lattice, points: PointSet, start: Point, good: (p: Point) => Bool, area: number) {
        const { And, Bool, Or, Sum } = this.context;
        let floodfill = new ValueMap(points, _ => Bool.fresh());
        for (const [p, arith] of floodfill) {
            this.add(arith.eq(p.eq(start) && good(p)));
        }
        for (let i = 0; i < area; i++) {
            const newFloodfill = new ValueMap(points, _ => Bool.fresh());
            for (const p of points) {
                this.add(
                    newFloodfill
                        .get(p)
                        .eq(
                            Or(
                                floodfill.get(p),
                                ...lattice.edgeSharingPoints(p).map(q => And(good(p), floodfill.get(q) || false))
                            )
                        )
                );
            }
            floodfill = newFloodfill;
        }
        this.add(Sum(...floodfill.values()).eq(area));
    }

    addContiguousBlockSums(line: Arith[], sums: string[]) {
        // For each horizontal/vertical line, use dynamic programming where num_blocks[i] is the
        // current number of blocks seen so far. Then anytime we end a block, we check if the block
        // is the right sum and increment num_blocks[i] if so. Otherwise, we keep num_blocks[i] as
        // the same value.
        // If the current block sum is '*', then we also allow incrementing the block regardless of
        // the current sum.
        const { And, Or, Sum } = this.context;
        if (sums.length === 0) {
            return;
        }
        line = [this.int(0, 0), ...line, this.int(0, 0)];
        const numBlocks = line.map(_ => this.int());
        for (let i = 1; i < line.length; i++) {
            const choices = [And(numBlocks[i].eq(numBlocks[i - 1]), Or(line[i - 1].eq(0), line[i].neq(0)))];
            for (const [blockNum, sum] of sums.entries()) {
                if (sum === "*") {
                    choices.push(And(numBlocks[i].eq(blockNum + 1), numBlocks[i - 1].eq(blockNum + 1)));
                } else {
                    const nextBlockNum = blockNum + (sums[blockNum + 1] === "*" ? 2 : 1);
                    for (let blockSize = 1; blockSize < i; blockSize++) {
                        const block = line.slice(i - blockSize, i);
                        choices.push(
                            And(
                                numBlocks[i].eq(nextBlockNum),
                                numBlocks[i - blockSize].eq(blockNum),
                                line[i].eq(0),
                                ...block.map(arith => arith.neq(0)),
                                sum === "?" ? true : Sum(...block).eq(parseInt(sum)),
                                line[i - blockSize - 1].eq(0)
                            )
                        );
                    }
                }
            }
            this.add(Or(...choices));
        }
        this.add(numBlocks[0].eq(sums[0] === "*" ? 1 : 0));
        this.add(numBlocks[numBlocks.length - 1].eq(sums.length));
    }

    addSightLineCount(
        lattice: Lattice,
        points: PointSet,
        start: Point,
        good: (p: Point, bearing?: Bearing) => Bool,
        count: number
    ) {
        const { And, Sum } = this.context;
        const cells = new ValueSet([start]);
        const visible = [good(start)];
        for (const bearing of lattice.bearings()) {
            const line = points.lineFrom(start, bearing);
            for (let i = 1; i < line.length; i++) {
                if (!cells.has(line[i])) {
                    cells.add(line[i]);
                    visible.push(And(...line.slice(0, i + 1).map(p => good(p, bearing))));
                }
            }
        }
        this.add(Sum(...visible).eq(count));
    }

    async solve(arithsIt: Iterable<[any, Arith]>) {
        const ariths = [...arithsIt];
        if (this.differentFrom) {
            // uniqueness constraint
            this.solver.add(this.context.Or(...ariths.map(([key, arith]) => arith.neq(this.differentFrom.get(key)))));
        }
        switch (await this.solver.check()) {
            case "sat":
                const z3Model = this.solver.model();
                const model = { get: (arith: Arith) => Number((z3Model.eval(arith) as any).value()) };
                this.setValues(new ValueMap(ariths.map(([key, arith]) => [key, model.get(arith)])));
                return model;
            case "unsat":
                throw new Error(this.differentFrom ? "No other solution found." : "No solution found.");
            case "unknown":
                throw new Error("An unknown error occurred.");
        }
    }
}
