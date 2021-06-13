import path from "path";
import { invokeChildThreadMethods } from "../index";
import { AutomatorConfig } from "./index";
import { RunJobInThread } from "./RunJobInThread";

export type RunJobInThreadConfig = {
    modulesDirs: Array<string>
    fileLoggerName: string
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
export function runJobInThread(config: RunJobInThreadConfig): RunJobInThread {
    const extName = path.extname(__filename);
    const threadModulePath = path.join(__dirname, `RunJobInThread${extName}`);
    const { invoke, thread } = invokeChildThreadMethods<RunJobInThread>({
        module: threadModulePath,
        options: {
            cwd: process.cwd(),
            // execPath?: string;
            // execArgv?: string[];
            // silent?: boolean;
            // stdio?: StdioOptions;
            // detached?: boolean;
            // windowsVerbatimArguments?: boolean;
        }
    });

    thread.on("error", err => {
        console.log(err);
    });

    return invoke;
}