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

export interface StepMiddlewareContext extends IMapDeep<any> {
    http?: IHttpClient
    logger?: ILogger
}

export interface StepMiddlewareCtor {
    /**
     * 全部配置信息
     */
    config: AutomatorConfig
    /**
     * 当前Job配置信息
     */
    job: AutomatorJobConfig
    /**
     * 当前步骤配置信息
     */
    step: AutomatorStepConfig
    /**
     * 启动时传入的参数信息
     */
    cmd: BaseTypeMap
}
