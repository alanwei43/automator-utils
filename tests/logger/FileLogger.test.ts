import { FileLogger } from "../../src/logger";

test("文件日志 正常写入", async () => {
    const logger = new FileLogger(Date.now().toString(16));
    logger.debug(JSON.stringify({ t: "hello world." }));
    logger.debug(JSON.stringify({ name: "Alan Wei" }));
    const lines = logger.parseLines<{ t: string, name: string }>("debug");
    expect(lines.length).toBe(2);
    expect(lines[0].t).toBe("hello world.");
    expect(lines[1].name).toBe("Alan Wei");
})