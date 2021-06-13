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

export async function runJobInThread(config: RunJobInThreadConfig): Promise<any> {
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

    const result = await invoke.start(config);
    invoke.exit();
    return result;
}