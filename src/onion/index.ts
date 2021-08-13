import { ILogger } from "../logger";
import { IHttpClient } from "../network";
import { PlainObject } from "../types";

export type MiddlewareContext = {
    http?: IHttpClient
    logger?: ILogger
} & PlainObject

export type NextMiddleware<TMiddleware extends OnionMiddleware<any>> = {
    middleware: TMiddleware
    (...args: Array<any>): Promise<any>
}

export interface OnionMiddleware<TContext> {
    execute(next: NextMiddleware<OnionMiddleware<TContext>>, context: TContext, ...args: Array<any>): Promise<any>;
}

export * from "./OnionCompose";
export * from "./OnionComposeSimple";