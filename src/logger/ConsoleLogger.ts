import { ILogger } from "./ILogger";

export class ConsoleLogger implements ILogger {
    debug(...args: any[]): void {
        console.debug.apply(console, args);
    }
    warn(...args: any[]): void {
        console.warn.apply(console, args);
    }
    error(...args: any[]): void {
        console.error.apply(console, args);
    }
}