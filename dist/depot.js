"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const level = require("level");
class Depot {
    constructor(location, encoding) {
        let valueEncoding;
        if (encoding) {
            valueEncoding = Object.assign({ buffer: true, type: "CustomDepotEncoding" }, encoding);
        }
        else {
            valueEncoding = "json";
        }
        this.db = level(location, { keyEncoding: "utf8", valueEncoding });
    }
    all(where, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = this.db.createValueStream();
            const result = [];
            return new Promise((resolve, reject) => {
                stream
                    .on('data', function (data) {
                    if (!!limit && !(result.length < limit))
                        return;
                    if (!!where && !where(data))
                        return;
                    result.push(data);
                })
                    .on('error', reject)
                    .on('end', () => resolve(result));
            });
        });
    }
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query) {
                const items = yield this.all(query.where, query.limit);
                if (query.sort)
                    return items.sort(query.sort);
                return items;
            }
            return this.all();
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            return new Promise((resolve, reject) => {
                this.db.createKeyStream()
                    .on("data", () => count += 1)
                    .on("error", reject)
                    .on("end", () => resolve(count));
            });
        });
    }
    forEach(cb) {
        let stopped = false;
        let stopper = () => stopped = true;
        this.db.createValueStream()
            .on('data', function (data) {
            if (!stopped)
                cb(data, stopper);
        });
    }
    put(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.put(key, value);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.get(key);
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.del(key);
        });
    }
    createReadStream(options) {
        return this.db.createReadStream(options);
    }
}
exports.Depot = Depot;
