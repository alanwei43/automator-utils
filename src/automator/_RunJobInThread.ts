import { Automator, JobData } from "./Automator";
import { StepMiddlewareContext, StepMiddleware } from "./StepMiddleware";
import { OnionCompose, exposeMethodsToOtherThread } from "../index";
import { IRunJobInThread, RunJobInThreadStartConfig } from "./IRunJobInThread";

export class RunJobInThread implements IRunJobInThread {
    private runner: OnionCompose<StepMiddlewareContext, StepMiddleware>

    async start(config: RunJobInThreadStartConfig, cmd: any): Promise<any> {
        if (this.runner) {
            console.log(`当前线程${process.pid}已经开始执行`);
            return;
        }

        const automator = new Automator({ "modulesRootDir": config.modulesDirs });
        automator.refreshModules(false);
        let job: OnionCompose<StepMiddlewareContext, StepMiddleware> = null;
        const jobData: JobData = { "stepCmd": cmd, "context": {} };
        if (typeof config.jobConfig === "string") {
            job = automator.getJobByFile(config.jobConfig, config.jobActionName, jobData);
        } else {
            job = automator.getJob(config.jobConfig, config.jobActionName, jobData);
        }
        this.runner = job;
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