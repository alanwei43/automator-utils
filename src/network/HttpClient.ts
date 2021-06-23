import type { StringMap } from "../types";
import { FileCache, ICache, NullCache } from '../cache';
import { getRandomInt, wait } from '../utils'
import { FetchConfig, AbsHttpClient } from './index';
import fetch, { FetchError } from "node-fetch";
import { FileLogger, ILogger, NullLogger } from '../logger';

export type HttpClientInit = {
    logger?: ILogger
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
        super(init.logger || new NullLogger());

        this.globalConfig = {
            /** 默认配置 */
            userAgents: [],
            /** 用户配置 */
            ...init,
        };
    }
    async request(reqConfig: FetchConfig): Promise<Buffer> {
        const key = [reqConfig.method, reqConfig.url, reqConfig.body].filter(part => typeof part === "string").join(",");
        this.logger.debug(`HTTP请求的Cache Id: ${key}`);
        if (this.globalConfig.cache && !reqConfig.disableCache) {
            const data = await this.globalConfig.cache.getCache(key);
            if (data && data.length) {
                this.logger.debug(`使用缓存: ${reqConfig.url}`);
                return data;
            }
        }
        if (reqConfig.headers === null || reqConfig.headers === undefined) {
            reqConfig.headers = {};
        }
        if (typeof reqConfig.headers["user-agent"] !== "string" && Array.isArray(this.globalConfig.userAgents)) {
            reqConfig.headers["user-agent"] = this.globalConfig.userAgents[getRandomInt(0, this.globalConfig.userAgents.length)];
        }
        if (typeof reqConfig.timeout !== "number" && typeof this.globalConfig.timeoutMs === "number") {
            reqConfig.timeout = this.globalConfig.timeoutMs;
        }
        if (this.globalConfig.defaultHeaders) {
            for (let key in this.globalConfig.defaultHeaders) {
                reqConfig.headers[key] = this.globalConfig.defaultHeaders[key];
            }
        }
        const waitTime = this.globalConfig.waitMsPerRequest;
        if (typeof waitTime === "number" && waitTime > 0) {
            this.logger.debug(`请求前等待 ${waitTime}ms`);
            await wait(waitTime);
        }
        this.logger.debug(`执行请求前处理`);
        await this.onRequestBefore(reqConfig);
        try {
            this.logger.debug(`开始发起请求: ${reqConfig.url}`);
            const response = await fetch(reqConfig.url, reqConfig);
            this.logger.debug(`读取响应buffer`);
            const buf = await response.buffer();
            this.logger.debug(`响应buffer长度: ${buf && buf.length}`);
            if (buf && buf.length) {
                this.globalConfig.cache && this.globalConfig.cache.updateCache(key, buf);
            } else {
                throw new FetchError(`响应内容为空`, "response-body-empty")
            }
            return buf;
        } catch (err) {
            const rc = typeof reqConfig.retryCount === "number" ? reqConfig.retryCount : this.globalConfig.maxRetryCount;
            this.logger.debug(`响应异常: ${err && err.message ? err.message : err}, 剩余重试次数: ${rc}`);
            await this.onRequestError(err, rc);

            if (typeof rc === "number" && rc > 0) {
                let waitTime = 0;
                const { min, max } = this.globalConfig.retryWaitTimes || reqConfig.retryWaitTimes || {};
                if (typeof min === "number" && typeof max === "number") {
                    waitTime = getRandomInt(min, max) * 1000;
                }
                this.logger.warn(`retryCount: ${rc}, 返回错误: ${err.message}, 准备等待${waitTime}ms`);
                await wait(waitTime); // 发生错误了增加等待时长
                return await this.request({ ...reqConfig, retryCount: rc - 1 });
            } else {
                this.logger.error(`retryCount: ${rc}, 获取失败: ${err.message}`);
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

    static InitClientByNull(): HttpClient {
        return HttpClient.InitBasicClient({
            logger: new NullLogger(),
            cache: new NullCache()
        })
    }

    static InitClientByFile(fileLoggerName: string, fileCacheDir: string, requestTimeout?: number): HttpClient {
        const logger = new FileLogger(fileLoggerName);
        return HttpClient.InitBasicClient({
            logger: logger,
            cache: new FileCache(fileCacheDir, 2, logger),
            requestTimeout: requestTimeout
        })
    }

    static InitBasicClient(config: { logger: ILogger, cache: ICache, requestTimeout?: number }): HttpClient {
        const init: HttpClientInit = {
            logger: config.logger,
            cache: config.cache,
            timeoutMs: config.requestTimeout,
            defaultHeaders: {
                "cache-control": "no-cache",
                "pragma": "no-cache",
            }
        };
        return new HttpClient(init);
    }
}