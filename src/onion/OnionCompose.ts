/**
 * 洋葱模型实现
 */
export class OnionCompose<TContext, TMiddleware extends OnionMiddleware<TContext>> {
    /**
     * 用于存储中间件
     */
    private readonly middlewares: Array<TMiddleware> = []
    /**
     * 是否已经取消
     */
    private canceled: boolean
    /**
     * 是否已经结束
     */
    private finished: boolean
    /**
     * 下一个
     */
    private nextCompose?: OnionCompose<TContext, TMiddleware>

    constructor(private readonly context: TContext) { }

    updateNext(next: OnionCompose<TContext, TMiddleware>) {
        this.nextCompose = next;
    }

    /**
     * 添加中间件
     * @param middleware 中间件
     */
    use(middleware: TMiddleware): void {
        this.middlewares.push(middleware);
    }

    /**
     * 开始执行
     * @param args 
     */
    async run(...args: Array<any>): Promise<any> {
        //ref https://zhuanlan.zhihu.com/p/45837799
        const initialContext: TContext = this.context === null || this.context === undefined ? Object.create({}) : this.context;

        const self = this;
        const waiting = (async function dispatch(
            index: number,
            middlewares: Array<TMiddleware>,
            context: TContext,
            transferArgs: any[],
        ): Promise<any> {
            if (self.canceled) {
                // 取消执行
                return;
            }

            if (index === middlewares.length) {
                // 当前已经执行到了最后一个
                self.finished = true;
                return transferArgs;
            }
            const currentMiddleware = middlewares[index]; // 当前待执行的中间件
            // 构造下一个中间件执行函数
            const next: NextMiddleware<TMiddleware> = function (...args) {
                // 开始执行下一个中间件
                let newContext = context;
                if (this && this.context) {
                    newContext = this.context;
                }
                return dispatch(index + 1, middlewares, newContext, args);
            };
            next.prevMiddleware = middlewares[index - 1];
            next.nextMiddlware = middlewares[index + 1];

            const result = await currentMiddleware.execute.apply(currentMiddleware, [next, context, ...(transferArgs || [])]);
            return result;
        })(0, this.middlewares, initialContext, args); // 从第一个中间件开始执行

        return waiting.then(r => {
            /**
             * 当前所有中间件执行完成
             */
            if (this.nextCompose) {
                /**
                 * 如果有下一个Compose，继续执行下一个Compose
                 */
                return this.nextCompose.run(...args);
            }
            return r;
        });
    }

    /**
     * 取消中间件的执行
     */
    cancel() {
        this.canceled = true;
        if (this.nextCompose) {
            this.nextCompose.cancel();
        }
    }
}

export interface NextMiddleware<TMiddleware> {
    /**
     * 上一个中间件
     */
    prevMiddleware?: TMiddleware
    /**
     * 下一个中间件(及next执行的那个中间件)
     */
    nextMiddlware: TMiddleware
    (...args: Array<any>): Promise<any>
}
export interface OnionMiddleware<TContext> {
    execute(next: NextMiddleware<OnionMiddleware<TContext>>, context: TContext, ...args: Array<any>): Promise<any>;
}