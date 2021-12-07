import { ICache, UpdateCacheResult } from "./ICache";

export class NullCache implements ICache {
    getCache(key: string): Promise<Buffer> {
        return null;
    }
    updateCache(key: string, data: Buffer): Promise<UpdateCacheResult> {
        return Promise.resolve({ keyHash: "" });
    }
}
