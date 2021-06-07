import { PlainObject, StringMap } from "../types";
import { IHttpClient, encodeParams, FetchConfig } from './index';
import cheerio from "cheerio";
import { ILogger } from '../logger';
import fs from "fs";
import path from "path";
import { promisify } from "util";

export abstract class AbsHttpClient implements IHttpClient {
    constructor(protected logger: ILogger) {
    }

    abstract request(config: FetchConfig): Promise<Buffer>

    async getJson<T>(url: string, params?: PlainObject, headers?: StringMap): Promise<T> {
        let reqUrl = url;
        if (params) {
            reqUrl += "?" + encodeParams(params);
        }

        const response = await this.request({
            url: reqUrl,
            "method": "GET",
            "headers": {
                "accept": "application/json",
                ...(headers || {})
            },
        });
        if (!response) {
            return null;
        }
        let text = "";
        try {
            text = response.toString("utf-8");
            if (!text) {
                this.logger.warn(`接口返回数据为空,  URL: ${reqUrl}`);
                return null;
            }
            return JSON.parse(text);
        } catch (err) {
            this.logger.error(`接口返回数据格式化失败, 响应文本: ${text}, Error: ${err && err.message}, URL: ${reqUrl}`);
        }
        return null;
    }
    async postJson<T>(url: string, params?: PlainObject, body?: any, headers?: StringMap): Promise<T> {
        let reqUrl = url;
        if (params) {
            reqUrl += "?" + encodeParams(params);
        }

        const response = await this.request({
            url: reqUrl,
            "method": "POST",
            "headers": {
                "accept": "application/json",
                "content-type": "application/json",
                ...(headers || {})
            },
            body: body ? JSON.stringify(body) : ""
        });
        if (!response) {
            return null;
        }
        let text = "";
        try {
            text = response.toString("utf-8");
            if (!text) {
                this.logger.warn(`接口返回数据为空,  URL: ${reqUrl}`);
                return null;
            }
            return JSON.parse(text);
        } catch (err) {
            this.logger.error(`接口返回数据格式化失败, 响应文本: ${text}, Error: ${err && err.message}, URL: ${reqUrl}`);
        }
        return null;
    }

    async getText(url: string, params?: PlainObject, headers?: StringMap): Promise<string> {
        let reqUrl = url;
        if (params) {
            reqUrl += "?" + encodeParams(params);
        }

        const response = await this.request({
            url: reqUrl,
            "headers": headers,
            "method": "GET",
        });
        if (!response) {
            return null;
        }
        return response.toString("utf-8");
    }
    async getJsonp<T>(url: string, params: PlainObject, callbackParamName: string, callbackParamValue?: string, headers?: StringMap): Promise<T> {
        let reqUrl = url;
        if (!params) {
            params = {};
        }
        const callbackValue = callbackParamValue || `callback${Date.now().toString(16)}`;
        params[callbackParamName] = callbackValue;
        reqUrl += "?" + encodeParams(params);

        const response = await this.request({
            url: reqUrl,
            "headers": {
                "accept": "text/javascript, text/plain, */*",
                ...(headers || {})
            },
            "method": "GET",
        });
        if (!response) {
            return null;
        }
        const text = response.toString("utf-8");
        if (!text) {
            return null;
        }
        try {
            return new Function(`
function ${callbackValue}(data) { 
    return data; 
} 
return ${text};
`)();
        } catch (err) {
            this.logger.error(`接口返回数据解析失败: ${err && err.message}, URL: ${reqUrl}, 响应内容: ${text}`);
            return null;
        }
    }

    async postFormData<T>(url: string, params?: PlainObject, body?: PlainObject, headers?: StringMap): Promise<T> {
        let reqUrl = url;
        if (params) {
            reqUrl += "?" + encodeParams(params);
        }

        const reqBody = encodeParams(body);

        const response = await this.request({
            url: reqUrl,
            body: reqBody,
            "headers": {
                "content-type": "application/x-www-form-urlencoded",
                "accept": "application/json, text/plain, */*",
                ...(headers || {})
            },
            "method": "POST",
        });
        if (!response) {
            return null;
        }
        let text = "";
        try {
            text = response.toString("utf8");
            if (!text) {
                this.logger.warn(`接口返回数据为空,  URL: ${reqUrl}`);
                return null;
            }
            return JSON.parse(text);
        } catch (err) {
            this.logger.error(`接口返回数据格式化失败, 响应文本: ${text}, Error: ${err && err.message}, URL: ${reqUrl}`);
        }
    }

    async parseHtml(url: string): Promise<{ $: cheerio.Root, html: string }> {
        const buffer = await this.request({
            url: url,
            method: "GET"
        });
        if (!buffer) {
            return null;
        }
        const html = buffer.toString("utf-8");
        return {
            $: cheerio.load(html),
            html: html
        };
    }
    async saveAs(url: string, dest: string): Promise<boolean> {
        const buffer = await this.request({
            url: url,
            method: "GET"
        });
        if (!buffer) {
            return false;
        }
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) {
            await promisify(fs.mkdir)(dir, {
                recursive: true
            });
        }
        await promisify(fs.writeFile)(dest, buffer);
        return true;
    }
}