import { NextMiddleware, UtilData, StepMiddleware, StepMiddlewareCtor } from "../../../src";

export class RootModule extends StepMiddleware {
    public ctor: StepMiddlewareCtor & {
        cmd: {
            jobId: string
        }
    };
    async execute(next: NextMiddleware<StepMiddleware>, utils: UtilData, ...args: any[]): Promise<any> {
        return await next("Alan", "Wei");
    }
}