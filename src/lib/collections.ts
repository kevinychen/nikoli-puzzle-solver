/**
 * Set and map that handle key equality by value (with key.toString), not identity
 */

export class ValueSet<V> {
    private map = new ValueMap<V, true>([]);

    constructor(values: V[]) {
        values.forEach(value => this.map.set(value, true));
    }

    [Symbol.iterator](): Iterator<V, any, undefined> {
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

    add(value: V): this {
        this.map.set(value, true);
        return this;
    }

    delete(value: V) {
        this.map.delete(value);
    }

    forEach(callbackfn: (value: V) => void) {
        this.map.forEach((_, k) => callbackfn(k));
    }

    has(value: V): boolean {
        return this.map.has(value);
    }

    keys(): IterableIterator<V> {
        return this.map.keys();
    }

    toString() {
        return this.map.toString();
    }
}

export class ValueMap<K, V> {
    private keyMap = new Map<string, K>();
    private map = new Map<string, V>();

    constructor(keys: Iterable<K>, f: (key: K, index?: number) => V);

    constructor(entries: [K, V][]);

    constructor(arg0: Iterable<K> | [K, V][], arg1?: (key: K, index?: number) => V) {
        let entries;
        if (arg1 !== undefined) {
            entries = Array.from(arg0 as Iterable<K>, (key, i) => [key, arg1(key, i)]);
        } else {
            entries = arg0 as [K, V][];
        }
        entries.forEach(([key, value]) => {
            this.keyMap.set(key.toString(), key as K);
            this.map.set(key.toString(), value as V);
        });
    }

    [Symbol.iterator](): Iterator<[K, V], any, undefined> {
        const it = this.map.keys();
        return {
            next: () => {
                const next = it.next();
                return {
                    done: next.done,
                    value: [this.keyMap.get(next.value), this.map.get(next.value)],
                };
            },
        };
    }

    delete(key: K): boolean {
        this.keyMap.delete(key.toString());
        return this.map.delete(key.toString());
    }

    forEach(callbackfn: (value: V, key: K) => void) {
        this.map.forEach((v, k) => callbackfn(v, this.keyMap.get(k)));
    }

    get(key: K): V | undefined {
        return this.map.get(key?.toString());
    }

    has(key: K): boolean {
        return this.map.has(key?.toString());
    }

    keys(): IterableIterator<K> {
        return this.keyMap.values();
    }

    set(key: K, value: V): this {
        this.keyMap.set(key.toString(), key);
        this.map.set(key.toString(), value);
        return this;
    }

    size(): number {
        return this.map.size;
    }

    toString() {
        return Array.from(this.map.entries()).sort().toString();
    }

    values(): IterableIterator<V> {
        return this.map.values();
    }
}
