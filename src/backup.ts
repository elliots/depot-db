import level = require("level");
import fs = require("fs");
import split = require("split");
import through = require("through");
import zlib = require("zlib");

export class DepotBackupEngine {
    private readonly db: level.LevelUp<{}, {}, {}, {}>;

    constructor(db: level.LevelUp<{}, {}, {}, {}>) {
        this.db = db;
    }

    /**
     * Backup the db to a gzip file
     * @param location - Location to write backup to (Should end in .gz)
     */
    async backup(location: fs.PathLike): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.createBackupStream()
                .pipe(fs.createWriteStream(location))
                .once("close", resolve)
                .once("error", reject);
        })
    }

    /**
     * Load the db from a backup.gz
     * @param location Location of the backup gz
     */
    async loadBackup(location: fs.PathLike): Promise<void> {
        return this.loadFromBackupStream(fs.createReadStream(location, "utf8"));
    }

    /**
     * Load the gziped backup from a stream
     */
    loadFromBackupStream(source: NodeJS.ReadableStream): Promise<void> {
        let dbChain = Promise.resolve();
        source
            .pipe(zlib.createGunzip())
            .pipe(split())
            .pipe(through((str: string) => {
                const data = JSON.parse(str);
                dbChain = dbChain.then(() => this.db.put(data.key, data.value));
            }))
        return dbChain;
    }

    /** Returns a gzip backup stream */
    createBackupStream(): NodeJS.ReadableStream {
        return this.db.createReadStream()
            .pipe(through(function(this: any, data: any) {
                this.queue(JSON.stringify(data) + "\n");
            }))
            .pipe(zlib.createGzip());
    }

}