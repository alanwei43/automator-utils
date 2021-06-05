const { isMainThread, Worker, workerData } = require("worker_threads");

console.log("pid: ", process.pid);

if (isMainThread) {
    console.log("inside main")
    new Worker(__filename, {
        workerData: {
            set: new Set(["Alan", "Wei"])
        }
    });
} else {
    console.log("inside workder: ", isMainThread);
    console.log("work data: ", workerData);
}