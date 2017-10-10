declare module "levelup" {
    import stream = require("stream");

    export = levelup;

    namespace levelup {
        class LevelUp {
            createValueStream(): stream.Stream;
            put(key: any, value: any, cb: (err: Error) => void): void;
            get(key: any, cb: (err: Error, value: any) => void): void;
            del(key: any, cb: (err: Error) => void): void;
            createKeyStream(): stream.Stream;
        }
    }

    function levelup(location: string, opts: {
        keyEncoding: string,
        valueEncoding: string
    }): levelup.LevelUp;
}