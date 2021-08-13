import { NextMiddleware, OnionMiddleware, MiddlewareContext, PlainObject } from "../index";
import { AutomatorJobConfig, AutomatorStepConfig, AutomatorConfig } from "./index";

export type StepMiddlewareContext = {} & MiddlewareContext

export type StepMiddlewareCtor = {
    config: AutomatorConfig
    job: AutomatorJobConfig
    step: AutomatorStepConfig
    cmd: PlainObject
}

export abstract class StepMiddleware implements OnionMiddleware<StepMiddlewareContext> {
    public readonly ctor: StepMiddlewareCtor
    constructor(ctor: StepMiddlewareCtor) {
        this.ctor = ctor;
    }
    abstract execute(next: NextMiddleware<StepMiddleware>, context: StepMiddlewareContext, ...args: any[]): Promise<any>
}