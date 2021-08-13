import { OnionCompose, OnionMiddleware } from "./index";

export class OnionComposeSimple<TContext> extends OnionCompose<TContext, OnionMiddleware<TContext>> {
    constructor(util: TContext) {
        super(util);
    }
}