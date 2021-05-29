import { PlainObject, PlainObjectGeneric } from "../types";

export type CommanderType = {
    jobId: string
} & PlainObjectGeneric<Array<string>>

export type YamlConfig = {
    name: string
    actions: Array<YamlActionConfig>
} & PlainObject

export type YamlActionConfig = {
    name: string,
    steps: Array<string | YamlActionStepConfig>
} & PlainObject

export type YamlActionStepConfig = {
    name: string
} & PlainObject


export * from "./StepMiddleware";
