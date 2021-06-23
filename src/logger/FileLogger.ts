import path from "path";
import fs from "fs";
import { ILogger, LogLevel } from "./ILogger";


export class FileLogger implements ILogger {
    private readonly name: string
    private readonly dir: string
    private count: number = 0
    constructor(name: string, dest?: string, private readonly enableCount?: boolean) {
        this.name = name;
        this.dir = dest || path.join(process.cwd(), "logs");
        this.checkDir();
    }
    private checkDir() {
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir, { recursive: true });
        }
    }
    private write(level: LogLevel, ...args: Array<any>) {
        if (this.enableCount && this.count >= Number.MAX_SAFE_INTEGER) {
            this.count = 0;
        }
        const filePath = this.getLogFilePath(level);
        args.unshift(`[${this.enableCount ? ++this.count + " " : ""}${new Date().toLocaleString()}]`);
        args.push("\n");
        try {
            fs.appendFileSync(filePath, args.join(" "), {
                encoding: "utf8"
            });
        } catch (err) {
            console.warn(`write file(${filePath}) failed: `, err);
            this.checkDir();
        }
        return `[${new Date().toLocaleString()} ${level}] ${args.join(" ")}`;
    }
    debug(...args: Array<any>) {
        return this.write("debug", Array.from(arguments));
    }
    warn(...args: Array<any>) {
        return this.write("warn", Array.from(arguments));
    }
    error(...args: Array<any>) {
        return this.write("error", args);
    }
    getLogFilePath(level: LogLevel) {
        return path.join(this.dir, `${this.name}.${level}.log`);
    }
    parseLines<T>(level: LogLevel): Array<T> {
        const filePath = this.getLogFilePath(level);
        return FileLogger.parseFileLines<T>(filePath);
    }

    static parseFileLines<T>(filePath: string): Array<T> {
        const fileStat = fs.statSync(filePath);
        if (!fileStat || !fileStat.isFile()) {
            console.log(`${filePath} 文件不存在`);
            return [];
        }
        const fileLines = fs.readFileSync(filePath, { encoding: "utf-8" }).split("\n");
        const rows: Array<T> = [];
        for (let lineNumber = 0; lineNumber < fileLines.length; lineNumber++) {
            const rawLine = fileLines[lineNumber];
            const index = rawLine.indexOf("] ");
            const line = rawLine.substr(index + 2).trim();
            if (!line) {
                continue;
            }
            try {
                const row = JSON.parse(line);
                rows.push(row);
            } catch (err) {
                console.warn(`\n文件( ${filePath} )的第${lineNumber + 1}行内容格式失败: ${err && err.message}, 行内容为: ${rawLine}\n\n`);
            }
        }
        return rows;
    }
}
