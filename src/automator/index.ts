import { PlainObject, PlainObjectGeneric } from "../types";

export type YamlConfig = {
    name: string
    actions: Array<YamlActionConfig>
} & PlainObjectGeneric<string | number | boolean | Array<YamlActionConfig>>

export type YamlActionConfig = {
    name: string,
    steps: Array<YamlActionStepConfig | string>
} & PlainObjectGeneric<string | number | boolean | Array<YamlActionStepConfig | string>>

export type YamlActionStepConfig = {
    id: string
} & PlainObject


export * from "./StepMiddleware";
export * from "./Automator";
