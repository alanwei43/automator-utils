import { NextMiddleware, OnionMiddleware, BaseTypeMap } from "../index";
import { AutomatorJobConfig, AutomatorStepConfig, AutomatorConfig } from "./index";
import { ILogger } from "../logger";
import { IHttpClient } from "../network";
import { BaseTypes, IMapDeep } from "../types";

/**
 * Step中间件
 */
export abstract class StepMiddleware implements OnionMiddleware<StepMiddlewareContext> {
    constructor(public readonly ctor: StepMiddlewareCtor) { }
    abstract execute(next: NextMiddleware<StepMiddleware>, ctx: StepMiddlewareContext, ...args: Array<any>): Promise<any>
}

export interface StepMiddlewareContext extends IMapDeep<BaseTypes | IHttpClient | ILogger> {
    http?: IHttpClient
    logger?: ILogger
}

export interface StepMiddlewareCtor {
    config: AutomatorConfig
    job: AutomatorJobConfig
    step: AutomatorStepConfig
    cmd: BaseTypeMap
}
