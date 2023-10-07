import { ValueMap } from "./collections";

export class UnionFind<T> {
    private parents: ValueMap<T, T>;

    constructor() {
        this.parents = new ValueMap<T, T>([]);
    }

    union(x: T, y: T) {
        this.parents.set(this.find(x), this.find(y));
    }

    find(x: T): T {
        if (!this.parents.has(x) || this.parents.get(x) === x) {
            return x;
        }
        this.parents.set(x, this.find(this.parents.get(x)));
        return this.parents.get(x);
    }
}
