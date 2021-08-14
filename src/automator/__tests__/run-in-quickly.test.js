const RunInQuickly = require("../../dist/automator/run-in-quickly");
const path = require("path");

test("新线程执行job", async () => {
    const runner = RunInQuickly.runJobInThread();
    const sampleDir = path.join(__dirname, "sample-js-modules");
    const r = await runner.start({
        "fileLoggerName": "automator",
        "jobActionName": "job1",
        "jobConfig": path.join(sampleDir, "config.yml"),
        "modulesDirs": [sampleDir]
    }, {
        name: "Alan Wei"
    });
    expect(r).toBe(`ALAN WEI`);
    runner.exit();
});