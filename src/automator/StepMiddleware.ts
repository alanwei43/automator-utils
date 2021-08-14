import { NextMiddleware, OnionMiddleware, BaseTypeMap } from "../index";
import { AutomatorJobConfig, AutomatorStepConfig, AutomatorConfig } from "./index";
import { ILogger } from "../logger";
import { IHttpClient } from "../network";

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
} & Record<string, Record<string, string | number | boolean>>

export type StepMiddlewareCtor = {
    config: AutomatorConfig
    job: AutomatorJobConfig
    step: AutomatorStepConfig
    cmd: BaseTypeMap
}
