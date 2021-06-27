import { PlainObject, StringMap } from "../types";
import { RequestInit } from "node-fetch";

export type FetchConfig = {
    url: string
    retryCount?: number
    /**
     * 重试时的等待时间配置
     */
    retryWaitTimes?: {
        /**
         * 最小等待时间
         */
        min: number,
        /**
         * 最大等待时间
         */
        max: number
    }
    /**
     * 禁用缓存模块 ICache
     */
    disableCache?: boolean
} & RequestInit;

export interface IHttpClient {
    request(config: FetchConfig): Promise<Buffer>

    getJson<T>(url: string, params?: PlainObject, headers?: StringMap): Promise<T>
    postJson<T>(url: string, params?: PlainObject, body?: any, headers?: StringMap): Promise<T>
    getText(url: string, params?: PlainObject, headers?: StringMap): Promise<string>
    getJsonp<T>(url: string, params: PlainObject, callbackParamName: string, callbackParamValue?: string, headers?: StringMap): Promise<T>
    postFormData<T>(url: string, params?: PlainObject, body?: PlainObject, headers?: StringMap): Promise<T>
    parseHtml(url: string): Promise<{ $: cheerio.Root, html: string }>
    saveAs(url: string, dest: string): Promise<boolean>
}

export function encodeParams(params: PlainObject): string {
    if (!params) return "";
    return Object.keys(params)
        .map(key => ({
            key: key,
            value: params[key]
        }))
        .filter(kv => kv.value !== null && kv.value !== undefined)
        .map(kv => ({
            key: encodeURIComponent(kv.key + ""),
            value: encodeURIComponent(kv.value + "")
        }))
        .map(kv => `${kv.key}=${kv.value}`)
        .join("&");
}

/**
 * 给URL追加查询参数
 * @param url string
 * @param params URL查询参数
 */
export function appendUrlParams(url: string, params: PlainObject): string {
    if (!params) {
        return url;
    }
    const urlParams = encodeParams(params);
    if (!urlParams) {
        return url;
    }
    return `${url}${url.includes("?") ? "&" : "?"}${urlParams}`;
}

export const getUserAgents = () => [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36 Edg/86.0.622.38",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:88.0) Gecko/20100101 Firefox/88.0"
];