import { NextMiddleware, OnionMiddleware, UtilData } from "../onion";
import { CommanderType, YamlActionConfig, YamlActionStepConfig, YamlConfig } from "./index";

export type StepMiddlewareUtil = {} & UtilData

export type StepMiddlewareCtor = {
    config: YamlConfig
    action: YamlActionConfig
    step: YamlActionStepConfig
    cmd: CommanderType
}

export abstract class StepMiddleware implements OnionMiddleware<StepMiddlewareUtil> {
    public readonly ctor: StepMiddlewareCtor
    constructor(ctor: StepMiddlewareCtor) {
        this.ctor = ctor;
    }
    abstract execute(next: NextMiddleware<StepMiddleware>, utils: StepMiddlewareUtil, ...args: any[]): Promise<any>
}