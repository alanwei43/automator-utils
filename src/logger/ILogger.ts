export interface ILogger {
    debug(...args: Array<any>): void;
    warn(...args: Array<any>): void;
    error(...args: Array<any>): void;
}

export type LogLevel = "debug" | "warn" | "error";