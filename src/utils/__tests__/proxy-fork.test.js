const AutomatorUtils = require("../../dist/index");
const path = require("path");
const cp = require("child_process");

const moduleJs = path.join(__dirname, "proxy-fork-test", "child-thread.js");
test("测试调用子线程方法", async () => {
    const methods = AutomatorUtils.invokeChildThreadMethods({
        "module": moduleJs,
        "options": {
            cwd: process.cwd()
        }
    });
    const r = await methods.invoke.hello("Alan");
    expect(r).toBe("Hello Alan");
    const childPID = methods.thread.pid;
    const pid = await methods.invoke.getPID();
    expect(pid).toBe(childPID);
    methods.invoke.exit();
}, 10 * 1000);

test(`测试子线程调用父线程方法`, async () => {
    const thread = cp.fork(moduleJs, {
        cwd: process.cwd()
    });
    const proxy = AutomatorUtils.proxyOtherThreadMethods(thread, {});

    AutomatorUtils.exposeMethodsToOtherThread(thread, {
        getParentPID() {
            return process.pid
        },
    });
    const result = await proxy.testCallParentMethod(`getParentPID`);
    expect(result).toBe(process.pid);
    proxy.exit();
});