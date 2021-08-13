import { RunJobInThreadStartConfig, IRunJobInThread } from "./run-in-quickly";
import { Automator, JobsData } from "./Automator";
import { NullLogger, OnionCompose, StepMiddleware, MiddlewareContext, exposeMethodsToOtherThread, StepMiddlewareContext } from "../index";


export class RunJobInThread implements IRunJobInThread {
    private runner: OnionCompose<MiddlewareContext, StepMiddleware>

    async start(config: RunJobInThreadStartConfig, cmd: any): Promise<any> {
        if (this.runner) {
            console.log(`线程已经存在`);
            return;
        }

        const automator = new Automator({
            "logger": new NullLogger,
            "modulesRootDir": config.modulesDirs
        });
        automator.refreshModules(false);
        let jobs: Map<string, OnionCompose<StepMiddlewareContext, StepMiddleware>> = null;
        const jobsData: JobsData = { [config.jobActionName]: { "stepCmd": cmd, "context": {} } };
        if (typeof config.jobConfig === "string") {
            jobs = await automator.getJobsByFile(config.jobConfig, jobsData);
        } else {
            jobs = await automator.getJobs(config.jobConfig, jobsData);
        }
        this.runner = jobs.get(config.jobActionName);
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

exposeMethodsToOtherThread(process, new RunJobInThread());