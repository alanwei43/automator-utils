import { ILogger } from "./ILogger";

export class NullLogger implements ILogger {
    debug(...args: any[]): void {
    }
    warn(...args: any[]): void {
    }
    error(...args: any[]): void {
    }
}