
/**
 * manifest.yml:
 *  rootDir: "code-dir"
 *  files:
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

type ResourceManifest = {
    rootDir: string
    baseUrl?: string
    files: Array<{
        url: string
        name: string
        dir: string
    }>
}

export class ResourceDownloader {
    constructor(
        private http: IHttpClient,
        private manifestUrl: string,
        private manifestFormat: "yml" | "json"
    ) { }
    /**
     * 更新资源
     */
    async update(): Promise<boolean> {
        const manifestContent = await this.http.getText(this.manifestUrl);
        let manifestList: Array<ResourceManifest>;
        if (this.manifestFormat === "yml") {
            manifestList = parseYamlConfig<Array<ResourceManifest>>(manifestContent);
        }
        if (this.manifestFormat === "json") {
            manifestList = JSON.parse(manifestContent);
        }
        for (let manifest of manifestList) {
            if (!manifest || !manifest.rootDir) {
                continue;
            }
            const dest = path.join(process.cwd(), manifest.rootDir);
            for (let file of manifest.files) {
                const fileFullPath = path.join(dest, file.dir, file.name);
                await this.http.saveAs(`${manifest.baseUrl || ""}${file.url}`, fileFullPath);
            }
        }
        return true;
    }
}