import path from "path";
import { invokeChildThreadMethods } from "../index";
import { AutomatorConfig } from "./index";
import { IRunJobInThread, RunJobInThread } from "./RunJobInThread";

export type RunJobInThreadStartConfig = {
    modulesDirs: Array<string>
    fileLoggerName?: string
    /**
     * 配置文件路径或者配置信息
     */
    jobConfig: string | AutomatorConfig
    jobActionName: string
}

/**
 * 在新线程运行作业
 * @param config 配置
 */
export function runJobInThread(): IRunJobInThread {
    const extName = path.extname(__filename);
    const threadModulePath = path.join(__dirname, `RunJobInThread${extName}`);
    const { invoke, thread } = invokeChildThreadMethods<RunJobInThread>({
        module: threadModulePath
    });

    thread.on("error", err => {
        console.log(`runJobInThread: `, err);
    });

    return invoke;
}