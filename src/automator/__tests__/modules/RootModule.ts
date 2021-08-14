import { NextMiddleware, StepMiddlewareContext, StepMiddleware, StepMiddlewareCtor } from "../../../index";

export class RootModule extends StepMiddleware {
    public ctor: StepMiddlewareCtor & {
        cmd: {
            jobId: string
        }
    };
    async execute(next: NextMiddleware<StepMiddleware>, utils: StepMiddlewareContext, ...args: any[]): Promise<any> {
        return await next("Alan", "Wei");
    }
}