import { AutomatorConfig } from "./Automator";

export interface RunJobInThreadStartConfig {
    /**
     * 模块路径
     */
    modulesDirs: Array<string>
    fileLoggerName?: string
    /**
     * 配置文件路径或者配置信息
     */
    jobConfig: string | AutomatorConfig
    /**
     * 要执行的 job name
     */
    jobActionName: string
}

export interface IRunJobInThread {
    start(config: RunJobInThreadStartConfig, cmd: any): Promise<any>
    cancel(): void
    exit(): void
}
