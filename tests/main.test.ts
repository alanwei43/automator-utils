import cp from "child_process";
import cluster from "cluster";
import fs from "fs";

test("测试build", () => {
    const std = cp.execSync("ls -al", {
        "cwd": process.cwd()
    });
    const output = std.toString("utf-8");
    fs.writeFileSync("output.log", output);
})