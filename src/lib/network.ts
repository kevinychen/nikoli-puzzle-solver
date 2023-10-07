import { isEqual, range } from "lodash";
import { ValueSet } from "./collections";
import { Lattice } from "./geometry/lattice";
import { Vector } from "./geometry/vector";

/**
 * A network is a particular way that we can connect cells in a given lattice such that each cell
 * is connected to some subset of its edge sharing neighbors, called it's "direction set". For
 * example, a loop requires that each cell is either empty or has exactly two neighbors.
 */
export class Network {
    readonly numDirectionSets: number;

    constructor(readonly directionSets: Vector[][]) {
        this.numDirectionSets = directionSets.length;
    }

    findIndices(predicate: (vs: Vector[]) => boolean) {
        return range(this.directionSets.length).filter(i => predicate(this.directionSets[i]));
    }

    /** @returns all directions in the direction set with the given index */
    getDirections(i: number): Vector[] {
        return this.directionSets[i];
    }

    /** @returns the index of the direction set containing exactly the given directions */
    valueForDirections(...vs: Vector[]): number {
        return range(this.directionSets.length).find(i => isEqual(this.directionSets[i], vs.sort()));
    }

    /** @returns the index of all direction sets containing the given direction */
    valuesWithDirection(v: Vector): number[] {
        return range(this.directionSets.length).filter(i => this.directionSets[i].some(w => w.eq(v)));
    }

    /** A network where each cell can be any subset of directions */
    static all(lattice: Lattice): Network {
        const directions = lattice.edgeSharingDirections();
        const directionSets = [];
        for (let i = 0; i < 1 << directions.length; i++) {
            const bitmap = [...i.toString(2).padStart(directions.length, "0")].map(c => parseInt(c));
            directionSets.push(directions.filter((_, i) => bitmap[i]).sort());
        }
        return new Network(directionSets);
    }

    /** A network where each cell is either empty or has two outgoing directions */
    static loop(lattice: Lattice): Network {
        const directions = lattice.edgeSharingDirections();
        const directionSets = new ValueSet([[]]);
        for (const v1 of directions) {
            for (const v2 of directions) {
                if (!v1.eq(v2)) {
                    directionSets.add([v1, v2].sort());
                }
            }
        }
        return new Network([...directionSets]);
    }

    /** A network where each cell is either empty or has one or two outgoing directions */
    static path(lattice: Lattice): Network {
        const directions = lattice.edgeSharingDirections();
        const directionSets = new ValueSet([[]]);
        for (const v1 of directions) {
            directionSets.add([v1]);
            for (const v2 of directions) {
                if (!v1.eq(v2)) {
                    directionSets.add([v1, v2].sort());
                }
            }
        }
        return new Network([...directionSets]);
    }
}
