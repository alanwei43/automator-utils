import { ChildProcess, StdioOptions } from "child_process";
import path from "path";
import { invokeChildThreadMethods } from "../index";
import { IRunJobInThread } from "./IRunJobInThread";

/**
 * 在新线程运行作业
 * @param config 配置
 */
export function runJobInThread(opts: RunJobInThreadOpts): { invoke: IRunJobInThread, thread: ChildProcess } {
    const extName = path.extname(__filename);
    const threadModulePath = path.join(__dirname, `_RunJobInThread${extName}`);
    const { invoke, thread } = invokeChildThreadMethods<IRunJobInThread>({
        module: threadModulePath,
        cwd: opts.cwd,
        env: opts.env,
        stdio: opts.stdio
    });

    thread.on("error", err => {
        console.log(`runJobInThread: `, err);
    });

    return { invoke, thread };
}

export interface RunJobInThreadOpts {
    cwd: string
    env?: NodeJS.ProcessEnv
    stdio?: StdioOptions
}