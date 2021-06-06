import { FileCache } from "../index";

test("文件缓存 正常写入读取", async () => {
    const cache = new FileCache("logs");
    await cache.updateCache("hello", Buffer.from("hello world.", "utf-8"));
    const buf = await cache.getCache("hello");
    const value = buf.toString("utf-8")
    expect(value).toBe("hello world.");
});