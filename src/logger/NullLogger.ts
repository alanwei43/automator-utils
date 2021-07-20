import { ILogger } from "./ILogger";

export class NullLogger implements ILogger {
    debug(): void {
    }
    warn(): void {
    }
    error(): void {
    }
}