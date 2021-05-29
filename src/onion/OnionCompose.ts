import { NextMiddleware, OnionMiddleware } from "./index";

export class OnionCompose<TUtil, TMiddleware extends OnionMiddleware<TUtil>> {
    private readonly middlewares: Array<TMiddleware>
    private readonly utils: TUtil
    private canceled: boolean
    private finished: boolean

    constructor(util: TUtil) {
        this.middlewares = [];
        const def: any = {};
        this.utils = util || def;
    }

    use(middleware: TMiddleware): void {
        this.middlewares.push(middleware);
    }

    run() {
        //ref https://zhuanlan.zhihu.com/p/45837799
        const self = this;
        return (async function dispatch(index, middlewares, utils, transferArgs) {
            if (self.canceled) {
                return Promise.resolve("cancel");
            }

            if (index === middlewares.length) {
                self.finished = true;
                return Promise.resolve("end");
            }
            const mw = middlewares[index];
            const next: NextMiddleware<TMiddleware> = function (...args) {
                let u = utils;
                if (this && this.utils) {
                    u = this.utils;
                }
                return dispatch(index + 1, middlewares, u, args);
            };
            next.middleware = middlewares[index + 1];

            const result = await mw.execute.apply(mw, [next, utils, ...(transferArgs || [])]);
            return Promise.resolve(result);
        })(0, this.middlewares, self.utils, []);
    }

    cancel() {
        this.canceled = true;
    }
}
