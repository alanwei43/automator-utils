import { HttpClient, ResourceDownloader } from "../index";
import path from "path";
import fs from "fs";

test("资源下载 测试下载", async () => {
    const downloader = new ResourceDownloader(HttpClient.InitClientByNull());
    const results = await downloader.download([{
        "rootDir": "logs",
        "baseUrl": "http://www.alanwei.com/",
        "files": [{
            "url": "README.md"
        }, {
            "url": "README.md",
            "dir": "test",
            "name": "new-name.md"
        }]
    }]);
    expect(results.length).toBe(2);
    expect(results[0].status).toBe("success");
    expect(results[0].file).toBe(path.join(process.cwd(), "logs", "README.md"));
    expect(results[1].status).toBe("success");
    expect(results[1].file).toBe(path.join(process.cwd(), "logs", "test", "new-name.md"));

    fs.unlinkSync(results[0].file);
    fs.unlinkSync(results[1].file);
});