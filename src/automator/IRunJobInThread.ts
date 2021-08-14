import { AutomatorConfig } from "./Automator";

export type RunJobInThreadStartConfig = {
    modulesDirs: Array<string>
    fileLoggerName?: string
    /**
     * 配置文件路径或者配置信息
     */
    jobConfig: string | AutomatorConfig
    jobActionName: string
}

export interface IRunJobInThread {
    start(config: RunJobInThreadStartConfig, cmd: any): Promise<any>
    cancel(): void
    exit(): void
}
