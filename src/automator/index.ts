import { PlainObject, PlainObjectGeneric } from "../types";

export type AutomatorConfig = {
    name: string
    jobs: Array<AutomatorJobConfig>
} & PlainObjectGeneric<string | number | boolean | Array<AutomatorJobConfig>>

export type AutomatorJobConfig = {
    name: string,
    steps: Array<AutomatorStepConfig | string>
} & PlainObjectGeneric<string | number | boolean | Array<AutomatorStepConfig | string>>

export type AutomatorStepConfig = {
    id: string
} & PlainObject


export * from "./StepMiddleware";
export * from "./Automator";
export * from "./run-in-quickly";
