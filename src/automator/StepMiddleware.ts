import { NextMiddleware, OnionMiddleware, UtilData, PlainObject } from "../index";
import { AutomatorJobConfig, AutomatorStepConfig, AutomatorConfig } from "./index";

export type StepMiddlewareUtil = {} & UtilData

export type StepMiddlewareCtor = {
    config: AutomatorConfig
    job: AutomatorJobConfig
    step: AutomatorStepConfig
    cmd: PlainObject
}

export abstract class StepMiddleware implements OnionMiddleware<StepMiddlewareUtil> {
    public readonly ctor: StepMiddlewareCtor
    constructor(ctor: StepMiddlewareCtor) {
        this.ctor = ctor;
    }
    abstract execute(next: NextMiddleware<StepMiddleware>, utils: StepMiddlewareUtil, ...args: any[]): Promise<any>
}