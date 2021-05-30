import { ILogger } from "../logger";
import { IHttpClient } from "../network";
import { PlainObject } from "../types";

export type UtilData = {
    http?: IHttpClient
    logger?: ILogger
} & PlainObject

export type NextMiddleware<TMiddleware extends OnionMiddleware<any>> = {
    middleware: TMiddleware
    (...args: Array<any>): Promise<any>
}

export interface OnionMiddleware<TUtil> {
    execute(next: NextMiddleware<OnionMiddleware<TUtil>>, utils: TUtil, ...args: Array<any>): Promise<any>;
}

export * from "./OnionCompose";
export * from "./OnionComposeSimple";