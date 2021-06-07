import { ILogger, NullLogger } from "../index";
import { NextMiddleware, OnionMiddleware } from "./index";

export class OnionCompose<TUtil, TMiddleware extends OnionMiddleware<TUtil>> {
    private readonly middlewares: Array<TMiddleware> = []
    private canceled: boolean
    private finished: boolean

    constructor(
        private readonly utils: TUtil,
        private readonly logger: ILogger = new NullLogger()
    ) {
    }

    use(middleware: TMiddleware): void {
        const mwName: string = (middleware as any).name || "";
        const key = [typeof middleware, mwName].join(" ");
        this.logger.debug(`[${key}] 添加到中间件`);
        this.middlewares.push(middleware);
        // if (!mwName) {
        //     console.warn(`请设置中间件的name属性, 方便日志调试`);
        // }
    }

    async run(...args): Promise<any> {
        //ref https://zhuanlan.zhihu.com/p/45837799
        const initialUtils = this.utils === null || this.utils === undefined ? {} : this.utils;
        const self = this;
        const logKeyId = [
            `PID:${process.pid}`,
            `Start:${new Date().toLocaleString()}`
        ];
        this.logger.debug(`[${logKeyId.join(" ")}] 准备执行, 当前中间件数量: ${this.middlewares.length}`);
        const waiting = (async function dispatch(index, middlewares, utils, transferArgs) {
            if (index > 0) {
                logKeyId.pop();
            }
            logKeyId.push(`Index:${index}`);

            if (self.canceled) {
                // 取消执行
                self.logger.debug(`[${logKeyId.join(" ")}] 已经取消执行`);
                return Promise.resolve();
            }

            if (index === middlewares.length) {
                self.finished = true;
                // 最后一个中间件
                self.logger.debug(`[${logKeyId.join(" ")}] 中间件全部执行完毕`);
                return Promise.resolve(transferArgs);
            }
            const mw = middlewares[index];
            self.logger.debug(`[${logKeyId.join(" ")}] 获取到中间件 ${(mw as any).name}`);
            const next: NextMiddleware<TMiddleware> = function (...args) {
                self.logger.debug(`[${logKeyId.join(" ")}] next被调用`);
                let u = utils;
                if (this && this.utils) {
                    self.logger.debug(`[${logKeyId.join(" ")}] 使用this重置utils`);
                    u = this.utils;
                }
                return dispatch(index + 1, middlewares, u, args);
            };
            next.middleware = middlewares[index + 1];

            self.logger.debug(`[${logKeyId.join(" ")}] 调用中间件的execute方法开始执行`);
            const result = await mw.execute.apply(mw, [next, utils, ...(transferArgs || [])]);
            return Promise.resolve(result);
        })(0, this.middlewares, initialUtils, args);

        waiting.then(() => {
            this.logger.debug(`[${logKeyId.join(" ")}] 执行完成`);
        }).catch(err => {
            this.logger.debug(`[${logKeyId.join(" ")}] 执行失败; ${err && err.message}`);
        });
        return waiting;
    }

    cancel() {
        this.canceled = true;
    }
}
