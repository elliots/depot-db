"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const split = require("split");
const zlib = require("zlib");
const through = require("through");
/**
 * Backup the db to a gzip file
 * @param location - Location to write backup to (Should end in .gz)
 */
function backup(db, location) {
    return new Promise((resolve, reject) => {
        createBackupStream(db)
            .pipe(fs.createWriteStream(location))
            .once("close", resolve)
            .once("error", reject);
    });
}
/**
 * Load the db from a backup.gz
 * @param location Location of the backup gz
 */
function loadBackup(db, location) {
    return loadFromBackupStream(db, fs.createReadStream(location, "utf8"));
}
/**
 * Load the gziped backup from a stream
 */
function loadFromBackupStream(db, source) {
    let dbChain = Promise.resolve();
    source
        .pipe(zlib.createGunzip())
        .pipe(split())
        .pipe(through((str) => {
        const data = JSON.parse(str);
        dbChain = dbChain.then(() => db.put(data.key, data.value));
    }));
    return dbChain;
}
/** Returns a gzip backup stream */
function createBackupStream(db) {
    return db.createReadStream()
        .pipe(through(function (data) {
        this.queue(JSON.stringify(data) + "\n");
    }))
        .pipe(zlib.createGzip());
}
exports.utils = { backup, loadBackup, loadFromBackupStream, createBackupStream };
