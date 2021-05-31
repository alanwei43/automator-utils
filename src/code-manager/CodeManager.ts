
/**
 * manifest.yml:
 *  rootDir: "code-dir"
 *  codes:
 *      - url: https://xxxx.js
 *        dir: share/
 *      - url: https://xxx.js
 *        dir: utils/
 * 
 * 参考 dingtalk-listener
 * 参考 书签 ics-web 里的 网络 后台服务 支持redis等单例执行
 * const manager = new CodeManager(manifest.yml);
 * manager.clear();
 * manager.update();
 */

import { parseYamlConfig } from "../utils";
import { IHttpClient } from "../network";
import path from "path";

type CodeManifest = {
    rootDir: string
    files: Array<{
        url: string
        name: string
        dir: string
    }>
}

export class CodeManager {
    constructor(
        private http: IHttpClient,
        private manifestUrl: string,
        private manifestFormat: "yml" | "json"
    ) { }
    async update(): Promise<boolean> {
        const manifestContent = await this.http.getText(this.manifestUrl);
        let manifest: CodeManifest;
        if (this.manifestFormat === "yml") {
            manifest = parseYamlConfig<CodeManifest>(manifestContent);
        }
        if (this.manifestFormat === "json") {
            manifest = JSON.parse(manifestContent);
        }
        if (!manifest || !manifest.rootDir) {
            return false;
        }
        const dest = path.join(process.cwd(), manifest.rootDir);
        for (let file of manifest.files) {
            const fileFullPath = path.join(dest, file.dir, file.name);
            await this.http.saveAs(file.url, fileFullPath);
        }
        return true;
    }
}