import { OnionCompose, OnionMiddleware } from "../src/onion/index";

(async () => {
    const com = new OnionCompose<{}, OnionMiddleware<{}>>({});
    com.use({
        async execute(next, utils): Promise<any> {
            console.log("1-1");
            console.log("1: ", await next("alan", "wei"));
            console.log("1-2");
            return Promise.resolve("first");
        }
    });
    com.use({
        async execute(next, utils, fn, ln): Promise<any> {
            console.log(fn, ln);
            console.log("2-1");
            console.log("2: ", await next());
            console.log("2-2");
            return Promise.resolve("second");
        }
    });
    com.use({
        async execute(next): Promise<any> {
            console.log("3-1");
            console.log("3: ", await next());
            console.log("3-2");
            return Promise.resolve("third");
        }
    });
    await com.run();
})();