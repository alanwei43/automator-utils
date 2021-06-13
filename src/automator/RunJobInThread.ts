import { RunJobInThreadConfig } from "./run-in-quickly";
import { Automator, OnionComposeGetter } from "./Automator";
import { FileLogger, NullLogger, OnionCompose, StepMiddleware, UtilData, exposeMethodsToOtherThread } from "../index";


export class RunJobInThread {
    private runner: OnionCompose<UtilData, StepMiddleware>

    async start(config: RunJobInThreadConfig) {
        if (this.runner) {
            console.log(`线程已经存在`);
            return;
        }

        const automator = new Automator({
            "logger": config.fileLoggerName ? new FileLogger(config.fileLoggerName) : new NullLogger(),
            "modulesRootDir": config.modulesDirs
        });
        automator.refreshModules(false);
        let jobs: Map<string, OnionComposeGetter> = null;
        if (typeof config.jobConfig === "string") {
            jobs = await automator.getJobsByFile(config.jobConfig);
        } else {
            jobs = await automator.getJobs(config.jobConfig);
        }
        const action = jobs.get(config.jobActionName);
        this.runner = action({});
        const result = await this.runner.run();
        return result;
    }
    cancel() {
        if (!this.runner) {
            return;
        }
        this.runner.cancel();
    }
    exit() {
        process.exit(0)
    }
}

exposeMethodsToOtherThread(new RunJobInThread(), process);