import levelup = require("levelup");
import stream = require("stream");

export class Depot<TKey, TValue> {
    private readonly db: levelup.LevelUp;

    constructor(location: string) {
        this.db = levelup(location, { keyEncoding: "utf8", valueEncoding: "json" });
    }

    private async all(where?: (item: TValue) => boolean, limit?: number): Promise<TValue[]> {
        const stream = this.db.createValueStream()
        const result: TValue[] = [];
        return new Promise<TValue[]>((resolve, reject) => {
            stream
            .on('data', function(data: TValue) {
                if (!!limit && !(result.length < limit)) return;
                if (!!where && !where(data)) return;
                result.push(data);
            })
            .on('error', reject)
            .on('end', () => resolve(result));
        });
    }

    async put(key: TKey, value: TValue): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.db.put(key, value, e => {
                if (e) return reject(e);
                resolve();
            });
        });
    }

    async get(key: TKey): Promise<TValue> {
        return new Promise<TValue>((resolve, reject) => {
            this.db.get(key, (e, v) => {
                if (e) return reject(e);
                resolve(v);
            });
        });
    }

    async del(key: TKey): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.db.del(key, e => {
                if (e) return reject(e);
                resolve();
            });
        });
    }

    async find(query?: {
        where?: (item: TValue) => boolean;
        sort?: (item1: TValue, item2: TValue) => number;
        limit?: number
    }) {
        if (query) {
            const items = await this.all(query.where, query.limit);
            if (query.sort) return items.sort(query.sort);
            return items;
        }

        return this.all();
    }

    async count(): Promise<number> {
        let count = 0;
        return new Promise<number>((resolve, reject) => {
            this.db.createKeyStream()
                .on("data", () => count += 1)
                .on("error", reject)
                .on("end", () => resolve(count));
        });
    }

    forEach(cb: (item: TValue, stop: () => void) => void): void {
        let stopped = false;
        let stopper = () => stopped = true;
        this.db.createValueStream()
            .on('data', function (data: TValue) {
                if (!stopped) cb(data, stopper);
            });
    }
}
