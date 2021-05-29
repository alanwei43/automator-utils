import { PlainObject, PlainObjectGeneric } from "../types";

export type YamlConfig = {
    name: string
    actions: Array<YamlActionConfig>
} & PlainObjectGeneric<Array<YamlActionConfig>>

export type YamlActionConfig = {
    name: string,
    steps: Array<YamlActionStepConfig | string>
} & PlainObjectGeneric<Array<YamlActionStepConfig | string>>

export type YamlActionStepConfig = {
    id: string
} & PlainObject


export * from "./StepMiddleware";
export * from "./Automator";
