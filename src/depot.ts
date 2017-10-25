import level = require("level");

export class Depot<TKey, TValue> {
    private readonly db: level.LevelUp<{}, {}, {}, {}>;

    constructor(location: string) {
        this.db = level(location, { keyEncoding: "utf8", valueEncoding: "json" });
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
        return this.db.put(key, value);
    }

    async get(key: TKey): Promise<TValue> {
        return this.db.get(key);
    }

    async del(key: TKey): Promise<void> {
        return this.db.del(key);
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
