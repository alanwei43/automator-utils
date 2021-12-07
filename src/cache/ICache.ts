export interface ICache {
    getCache(key: string): Promise<Buffer>;
    updateCache(key: string, data: Buffer): Promise<UpdateCacheResult>;
}
export interface UpdateCacheResult {
    keyHash: string
}