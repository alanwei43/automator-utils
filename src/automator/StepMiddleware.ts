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
    abstract execute(next: NextMiddleware<StepMiddleware>, context: StepMiddlewareContext, ...args: any[]): Promise<any>
}

export type StepMiddlewareContext = {
    http?: IHttpClient
    logger?: ILogger
} & IMapDeep<BaseTypes>

export type StepMiddlewareCtor = {
    config: AutomatorConfig
    job: AutomatorJobConfig
    step: AutomatorStepConfig
    cmd: BaseTypeMap
}
