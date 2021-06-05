import type { StringMap } from "../types";
import { ICache, NullCache } from '../cache';
import { getRandomInt, wait } from '../utils'
import { FetchConfig, AbsHttpClient } from './index';
import fetch, { FetchError } from "node-fetch";
import { ILogger, NullLogger } from '../logger';

export type HttpClientInit = {
    logger: ILogger
    cache?: ICache
    waitMsPerRequest?: number
    maxRetryCount?: number
    timeoutMs?: number
    userAgents?: Array<string>
    defaultHeaders?: StringMap
    retryWaitTimes?: FetchConfig["retryWaitTimes"]
}

export class HttpClient extends AbsHttpClient {
    private readonly globalConfig: HttpClientInit

    constructor(init: HttpClientInit) {
        super(init.logger);

        if (!init.cache) {
            init.cache = new NullCache();
        }
        this.globalConfig = {
            /** 默认配置 */
            userAgents: [],
            cache: new NullCache(),
            /** 用户配置 */
            ...init,
        };
    }
    async request(config: FetchConfig): Promise<Buffer> {
        const key = [config.method, config.url, config.body].filter(part => typeof part === "string").join(",");
        this.logger.debug(`cache key: ${key}`);
        if (config.disableCache !== true) {
            const data = await this.globalConfig.cache.getCache(key);
            if (data && data.length) {
                this.logger.debug(`使用缓存: ${config.url}`);
                return data;
            }
        }
        if (!config.headers) {
            config.headers = {};
        }
        if (!config.headers["user-agent"]) {
            config.headers["user-agent"] = this.globalConfig.userAgents[getRandomInt(0, this.globalConfig.userAgents.length)];
        }

        if (typeof this.globalConfig.timeoutMs === "number") {
            config.timeout = this.globalConfig.timeoutMs;
        }
        if (this.globalConfig.defaultHeaders) {
            for (let key in this.globalConfig.defaultHeaders) {
                config.headers[key] = this.globalConfig.defaultHeaders[key];
            }
        }
        const waitTime = this.globalConfig.waitMsPerRequest || 0;
        this.logger.debug(`等待 ${waitTime}ms`);
        await wait(waitTime);
        this.logger.debug(`发起请求前处理`);
        await this.onRequestBefore(config);
        try {
            this.logger.debug(`开始发起请求: ${config.url}`);
            const response = await fetch(config.url, config);
            const buf = await response.buffer();
            this.logger.debug(`响应长度: ${buf && buf.length}`);
            if (buf && buf.length) {
                this.globalConfig.cache.updateCache(key, buf);
            } else {
                throw new Error("响应内容为空");
            }
            return buf;
        } catch (err) {
            const rc = typeof config.retryCount === "number" ? config.retryCount : this.globalConfig.maxRetryCount;
            this.logger.debug(`响应异常: ${err && err.message ? err.message : err}, 剩余重试次数: ${rc}`);
            await this.onRequestError(err, rc);

            if (typeof rc === "number" && rc > 0) {
                let waitTime = 0;
                const { min, max } = this.globalConfig.retryWaitTimes || config.retryWaitTimes || {};
                if (typeof min === "number" && typeof max === "number") {
                    waitTime = getRandomInt(min, max) * 1000;
                }
                this.logger.warn(`retryCount: ${rc}, 返回错误: ${err.message}, 准备等待${waitTime}ms, URL: ${config.url}`);
                await wait(waitTime); // 发生错误了增加等待时长
                return await this.request({ ...config, retryCount: rc - 1 });
            } else {
                this.logger.error(`retryCount: ${rc}, 获取失败: ${err.message}, URL: ${config.url}`);
                return null;
            }
        }
    }
    protected onRequestBefore(config: FetchConfig): Promise<void> {
        return Promise.resolve();
    }
    protected onRequestError(error: FetchError, letfRetryCount: number): Promise<void> {
        return Promise.resolve();
    }

    static InitClientBySimple(): HttpClient {
        const init: HttpClientInit = {
            logger: new NullLogger(),
            defaultHeaders: {
                "cache-control": "no-cache",
                "pragma": "no-cache",
            }
        };
        return new HttpClient(init);
    }
}