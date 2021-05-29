export interface ICache {
    getCache(key: string): Promise<Buffer>;
    updateCache(key: string, data: Buffer): Promise<void>;
}