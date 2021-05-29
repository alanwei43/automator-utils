import { ICache } from "./ICache";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { hash } from "../utils";
import { ILogger, NullLogger } from "../logger/index";


export class FileCache implements ICache {
    private readonly _dirPath: string
    private readonly _subDirLen?: number
    private readonly _logger: ILogger
    constructor(dir?: string, subDirLen?: number, logger?: ILogger) {
        this._dirPath = dir || path.join(process.cwd(), "data", "file-caches");
        this._subDirLen = typeof subDirLen === "number" ? subDirLen : 0;
        this._logger = logger || new NullLogger();

        if (!fs.existsSync(this._dirPath)) {
            fs.mkdirSync(this._dirPath, { recursive: true });
        }
    }
    private getFilePath(key: string): { key: string, hash: string, filePath: string, fileDir: string } {
        const hashKey = hash(key);
        const subDir = this._subDirLen > 0 ? hashKey.substr(0, this._subDirLen) : "";
        const filePath = path.join(this._dirPath, subDir, hashKey);

        return {
            key,
            filePath: filePath,
            fileDir: path.join(this._dirPath, subDir),
            hash: hashKey
        };
    }
    async getCache(key: string): Promise<Buffer> {
        const fp = this.getFilePath(key);
        const exist = await promisify(fs.exists)(fp.filePath);
        if (!exist) return null;
        const fileContent = await promisify(fs.readFile)(fp.filePath);
        return fileContent;
    }
    async updateCache(key: string, data: Buffer): Promise<void> {
        const fp = this.getFilePath(key);
        if (!fs.existsSync(fp.fileDir)) {
            fs.mkdirSync(fp.fileDir, {
                recursive: true
            });
        }
        await promisify(fs.writeFile)(fp.filePath, data);
        this._logger.debug(JSON.stringify({
            key: key,
            hash: fp.hash
        }));
    }
}
