import levelup = require("levelup");
import { encrypt, decrypt } from "./encryption";
import stream = require("stream");

export class EncryptedDepot<TKey, TValue> {
    private readonly db: levelup.LevelUp;

    constructor(location: string) {
        this.db = levelup(location, { keyEncoding: "utf8", valueEncoding: "utf8" });
    }

    private async all(opts: {
        passphrase: string;
        where?: (item: TValue) => boolean,
        limit?: number
    }): Promise<TValue[]> {
        const stream = this.db.createValueStream()
        const result: TValue[] = [];
        return new Promise<TValue[]>((resolve, reject) => {
            stream
            .on('data', function(store: string) {
                const data = JSON.parse(decrypt(opts.passphrase, store));
                if (!!opts.limit && !(result.length < opts.limit)) return;
                if (!!opts.where && !opts.where(data)) return;
                result.push(data);
            })
            .on('error', reject)
            .on('end', () => resolve(result));
        });
    }

    async put(opts: {
        key: TKey, value: TValue, passphrase: string
    }): Promise<void> {
        const store = encrypt(opts.passphrase, JSON.stringify(opts.value));
        return new Promise<void>((resolve, reject) => {
            this.db.put(opts.key, store, e => {
                if (e) return reject(e);
                resolve();
            });
        });
    }

    async get(key: TKey, passphrase: string): Promise<TValue> {
        return new Promise<TValue>((resolve, reject) => {
            this.db.get(key, (e, v) => {
                if (e) return reject(e);
                resolve(JSON.parse(decrypt(passphrase, v)) as TValue);
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

    async find(query: {
        passphrase: string;
        where?: (item: TValue) => boolean;
        sort?: (item1: TValue, item2: TValue) => number;
        limit?: number
    }) {
        const items = await this.all({
            passphrase: query.passphrase,
            where: query.where,
            limit: query.limit
        });
        if (query.sort) return items.sort(query.sort);
        return items;
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

    forEach(cb: (item: TValue, stop: () => void) => void, passphrase: string): void {
        let stopped = false;
        let stopper = () => stopped = true;
        this.db.createValueStream()
            .on('data', function (store: string) {
                const data = JSON.parse(decrypt(passphrase, store)) as TValue;
                if (!stopped) cb(data, stopper);
            });
    }
}
