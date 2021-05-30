import { OnionCompose, OnionMiddleware } from "./index";

export class OnionComposeSimple<TUtil> extends OnionCompose<TUtil, OnionMiddleware<TUtil>> {
    constructor(util: TUtil) {
        super(util);
    }
}