const AutomatorUtils = require("../../../dist/index");

const proxy = AutomatorUtils.proxyOtherThreadMethods(process, {});

AutomatorUtils.exposeMethodsToOtherThread(process, {
    hello(name) {
        return `Hello ${name}`;
    },
    getPID() {
        return process.pid;
    },
    testCallParentMethod(methodName) {
        return proxy[methodName]();
    },
    exit() {
        process.exit(0)
    }
});
