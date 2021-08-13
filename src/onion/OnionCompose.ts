import { ILogger, NullLogger } from "../index";
import { NextMiddleware, OnionMiddleware } from "./index";

export class OnionCompose<TContext, TMiddleware extends OnionMiddleware<TContext>> {
    private readonly middlewares: Array<TMiddleware> = []
    private canceled: boolean
    private finished: boolean
    private next?: OnionCompose<TContext, TMiddleware>
    private readonly _logger: ILogger

    constructor(
        private readonly context: TContext,
        logger?: ILogger
    ) {
        this._logger = logger || new NullLogger();
    }
    updateNext(next: OnionCompose<TContext, TMiddleware>) {
        this.next = next;
    }

    use(middleware: TMiddleware): void {
        const mwName: string = (middleware as any).name || "";
        const key = [typeof middleware, mwName].join(" ");
        this._logger.debug(`[${key}] 添加到中间件`);
        this.middlewares.push(middleware);
        // if (!mwName) {
        //     console.warn(`请设置中间件的name属性, 方便日志调试`);
        // }
    }

    async run(...args: Array<any>): Promise<any> {
        //ref https://zhuanlan.zhihu.com/p/45837799
        const initialContext = this.context === null || this.context === undefined ? {} : this.context;
        const self = this;
        const logKeyId = [
            `PID:${process.pid}`,
            `Start:${new Date().toLocaleString()}`
        ];
        this._logger.debug(`[${logKeyId.join(" ")}] 准备执行, 当前中间件数量: ${this.middlewares.length}`);
        const waiting = (async function dispatch(index, middlewares, context, transferArgs) {
            if (index > 0) {
                logKeyId.pop();
            }
            logKeyId.push(`Index:${index}`);

            if (self.canceled) {
                // 取消执行
                self._logger.debug(`[${logKeyId.join(" ")}] 已经取消执行`);
                return Promise.resolve();
            }

            if (index === middlewares.length) {
                self.finished = true;
                // 最后一个中间件
                self._logger.debug(`[${logKeyId.join(" ")}] 中间件全部执行完毕`);
                return Promise.resolve(transferArgs);
            }
            const mw = middlewares[index];
            self._logger.debug(`[${logKeyId.join(" ")}] 获取到中间件 ${(mw as any).name}`);
            const next: NextMiddleware<TMiddleware> = function (...args) {
                self._logger.debug(`[${logKeyId.join(" ")}] next被调用`);
                let newContext = context;
                if (this && this.context) {
                    self._logger.debug(`[${logKeyId.join(" ")}] 使用this重置context`);
                    newContext = this.context;
                }
                return dispatch(index + 1, middlewares, newContext, args);
            };
            next.middleware = middlewares[index + 1];

            self._logger.debug(`[${logKeyId.join(" ")}] 调用中间件的execute方法开始执行`);
            const result = await mw.execute.apply(mw, [next, context, ...(transferArgs || [])]);
            return Promise.resolve(result);
        })(0, this.middlewares, initialContext, args);


        return waiting.then(r => {
            this._logger.debug(`[${logKeyId.join(" ")}] 执行完成`);
            if (this.next) {
                this._logger.debug(`存在下一个job, 继续执行`);
                return this.next.run(...args);
            }
            return r;
        }).catch(err => {
            this._logger.error(`[${logKeyId.join(" ")}] 执行失败; ${err && err.message}`);
            throw err;
        });
    }

    cancel() {
        this.canceled = true;
        if (this.next) {
            this.next.cancel();
        }
    }
}
