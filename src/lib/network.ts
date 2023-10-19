import { Lattice } from "./geometry/lattice";
import { Point } from "./geometry/point";
import { Vector } from "./geometry/vector";

/**
 * A network represents a possible set of directions (to neighboring cells) for each cell in a
 * lattice. For example, a loop requires that each cell is either empty or has exactly two
 * neighbors.
 */
export interface Network {
    directionSets(p: Point): Vector[][];
}

abstract class AbstractNetwork implements Network {
    constructor(private readonly lattice: Lattice) {}

    directionSets(p: Point) {
        const directions = this.lattice.edgeSharingDirections(p);
        const directionSets = [];
        for (let i = 0; i < 1 << directions.length; i++) {
            const bitmap = [...i.toString(2).padStart(directions.length, "0")].map(c => parseInt(c));
            const directionSet = directions.filter((_, i) => bitmap[i]).sort();
            if (this.isValid(directionSet)) {
                directionSets.push(directionSet);
            }
        }
        return directionSets;
    }

    abstract isValid(vs: Vector[]): boolean;
}

export class FullNetwork extends AbstractNetwork {
    isValid() {
        return true;
    }
}

export class LoopNetwork extends AbstractNetwork {
    isValid(vs: Vector[]) {
        return vs.length === 0 || vs.length === 2;
    }
}

export class PathNetwork extends AbstractNetwork {
    isValid(vs: Vector[]) {
        return vs.length <= 2;
    }
}
