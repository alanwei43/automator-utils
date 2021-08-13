import { PlainObject, OnionCompose, OnionMiddleware } from "../index";

test("洋葱模型 忽略next", async () => {
    let count = 0;
    const com = new OnionCompose<{}, OnionMiddleware<{}>>({});
    com.use({
        async execute(next, utils): Promise<any> {
            count++;
            const r = await next();
            return Promise.resolve("第一个中间件:" + r);
        }
    });
    com.use({
        async execute(next, utils): Promise<any> {
            // 这里忽略第三个中间件执行
            count++;
            return Promise.resolve("第二个中间件");
        }
    });
    com.use({
        async execute(next, utils): Promise<any> {
            count++;
            return Promise.resolve("第三个中间件");
        }
    });
    const result = await com.run();
    expect(result).toBe(`第一个中间件:第二个中间件`);
    expect(count).toBe(2);
});

test("洋葱模型 所有中间件顺序执行", async () => {
    let count = 0;
    const com = new OnionCompose<{}, OnionMiddleware<{}>>({});
    com.use({
        async execute(next, utils): Promise<any> {
            count++;
            const r = await next();
            return Promise.resolve("m1:" + r);
        }
    });
    com.use({
        async execute(next, utils): Promise<any> {
            count++;
            const r = await next();
            return Promise.resolve("m2:" + r);
        }
    });
    com.use({
        async execute(next, utils): Promise<any> {
            count++;
            const r = await next();
            return Promise.resolve("m3:" + r);
        }
    });
    const result = await com.run();
    expect(result).toBe(`m1:m2:m3:`);
    expect(count).toBe(3);
});

test(`洋葱模型 修改util正确传递`, async () => {
    type Util = {} & PlainObject;
    const u = [];
    const com = new OnionCompose<Util, OnionMiddleware<Util>>({});
    com.use({
        async execute(next, utils): Promise<any> {
            u.push(JSON.stringify(utils));
            utils.m1 = 1;
            const r = await next();
            return Promise.resolve("m1:" + r);
        }
    });
    com.use({
        async execute(next, utils): Promise<any> {
            u.push(JSON.stringify(utils));
            utils.m2 = 2;
            const r = await next();
            return Promise.resolve("m2:" + r);
        }
    });
    com.use({
        async execute(next, utils): Promise<any> {
            u.push(JSON.stringify(utils));
            utils.m3 = 3;
            const r = await next();
            return Promise.resolve("m3:" + r);
        }
    });
    const result = await com.run();
    expect(result).toBe(`m1:m2:m3:`);
    expect(u.length).toBe(3);
    expect(u[0]).toBe(`{}`);
    expect(u[1]).toBe(`{"m1":1}`);
    expect(u[2]).toBe(`{"m1":1,"m2":2}`);
});

test(`洋葱模型 重置util`, async () => {
    type Util = {} & PlainObject;
    const u = [];
    const com = new OnionCompose<Util, OnionMiddleware<Util>>({
        origin: "hello"
    });
    com.use({
        async execute(next, utils): Promise<any> {
            u.push(JSON.stringify(utils));
            const r = await next.apply({
                context: {
                    new: "m1"
                }
            });
            return Promise.resolve("m1:" + r);
        }
    });
    com.use({
        async execute(next, utils): Promise<any> {
            u.push(JSON.stringify(utils));
            utils.m2 = 2;
            const r = await next();
            return Promise.resolve("m2:" + r);
        }
    });
    com.use({
        async execute(next, utils): Promise<any> {
            utils.m3 = 3;
            u.push(JSON.stringify(utils));
            const r = await next();
            return Promise.resolve("m3:" + r);
        }
    });
    const result = await com.run();
    expect(result).toBe(`m1:m2:m3:`);
    expect(u.length).toBe(3);
    expect(u[0]).toBe(`{"origin":"hello"}`);
    expect(u[1]).toBe(`{"new":"m1"}`);
    expect(u[2]).toBe(`{"new":"m1","m2":2,"m3":3}`);
});