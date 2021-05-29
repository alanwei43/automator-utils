import { FetchConfig } from './index';
import { HttpClient, HttpClientInit } from './HttpClient';
import type { Agent } from "http";
import { FetchError } from 'node-fetch';
import * as Socks5Https from "socks5-https-client/lib/Agent";
import * as Socks5Http from "socks5-http-client/lib/Agent";
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

export type ProxyAgentManager = {
    getProxyAgent(reqUrl: string): Promise<ProxyAgentResult>
    onRequestError(error: any, retryCount: number): Promise<void>
}
export type ProxyAgentResult = {
    host: string
    port: number
    type: "sock5" | "http"
}
export type HttpProxyInit = {
    ProxyManager: ProxyAgentManager
} & HttpClientInit

export class HttpProxyClient extends HttpClient {
    private _proxyManager: ProxyAgentManager

    constructor(init: HttpProxyInit) {
        super(init);
        this._proxyManager = init.ProxyManager
    }

    private async getProxyAgent(reqUrl: string): Promise<Agent> {
        const proxyAgent = await this._proxyManager.getProxyAgent(reqUrl);
        if (proxyAgent === null) {
            return null;
        }
        const isHttps = reqUrl.toLowerCase().startsWith("https");
        if (proxyAgent.type === "sock5") {
            const cls = isHttps ? Socks5Https : Socks5Http;
            return new cls.default({
                socksHost: proxyAgent.host,
                socksPort: proxyAgent.port
            });
        }
        if (proxyAgent.type === "http") {
            const cls = isHttps ? HttpsProxyAgent : HttpProxyAgent;
            return new cls({
                host: proxyAgent.host,
                port: proxyAgent.port
            });
        }
        return null;
    }
    protected async onRequestBefore(config: FetchConfig): Promise<void> {
        config.agent = await this.getProxyAgent(config.url);
        return Promise.resolve();
    }
    protected async onRequestError(error: FetchError, letfRetryCount: number): Promise<void> {
        try {
            this.logger.warn(`请求异常, retry count: ${letfRetryCount}, type: ${error.type}, code: ${error.code}`);
            await this._proxyManager.onRequestError(error, letfRetryCount);
        } catch (err) {
            this.logger.error(`代理反馈或获取异常: ${err && err.message}`);
        }
        return Promise.resolve();
    }
}