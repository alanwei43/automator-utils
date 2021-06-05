const cp = require("child_process");

const p = cp.fork("./worker.js", {
    cwd: __filename,
});
p.on("message", (msg) => {
    console.log(msg);
});
p.send({ fn: "Alan" });