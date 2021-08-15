import { ILogger } from "./ILogger";

export class ConsoleLogger implements ILogger {
    debug(...args: any[]): void {
        console.debug.apply(console, [`[${new Date().toLocaleString()}]`, ...args]);
    }
    warn(...args: any[]): void {
        console.warn.apply(console, [`[${new Date().toLocaleString()}]`, ...args]);
    }
    error(...args: any[]): void {
        console.error.apply(console, [`[${new Date().toLocaleString()}]`, ...args]);
    }
}