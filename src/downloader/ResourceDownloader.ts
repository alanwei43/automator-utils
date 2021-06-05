
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

import { hash, parseYamlConfig } from "../utils";
import { IHttpClient } from "../network";
import path from "path";

export type ResourceDownloaderManifest = {
    /**
     * 文件保存的根目录
     */
    rootDir: string
    /**
     * URL前缀
     */
    baseUrl?: string
    /**
     * 文件列表
     */
    files: Array<{
        /**
         * 文件对应的URL
         */
        url: string
        /**
         * 文件名, 默认URL的文件名
         */
        name?: string
        /**
         * 文件保存路径, 结合 rootDir 
         */
        dir?: string
    }>
}
type ResourceDownloadResult = {
    url: string
    file: string
    status: string
}

export class ResourceDownloader {
    constructor(
        private http: IHttpClient
    ) { }
    /**
     * 从远程更新资源
     */
    async downloadViaRemote(manifestUrl: string, manifestFormat: "yml" | "json"): Promise<Array<ResourceDownloadResult>> {
        const manifestContent = await this.http.getText(manifestUrl);
        let manifestList: Array<ResourceDownloaderManifest>;
        if (manifestFormat === "yml") {
            manifestList = parseYamlConfig<Array<ResourceDownloaderManifest>>(manifestContent);
        }
        if (manifestFormat === "json") {
            manifestList = JSON.parse(manifestContent);
        }
        return this.download(manifestList);
    }

    async download(manifestList: Array<ResourceDownloaderManifest>): Promise<Array<ResourceDownloadResult>> {
        const list: Array<ResourceDownloadResult> = [];
        for (let manifest of manifestList) {
            if (!manifest || !manifest.rootDir) {
                continue;
            }
            const dest = path.join(process.cwd(), manifest.rootDir);
            for (let file of manifest.files) {
                const fullUrl = `${manifest.baseUrl || ""}${file.url}`;
                const fileName = file.name || path.basename(file.url) || hash(fullUrl);
                const fileFullPath = path.join(dest, file.dir || "", fileName);
                const result: ResourceDownloadResult = {
                    url: fullUrl,
                    file: fileFullPath,
                    status: "ready"
                };
                list.push(result);
                try {
                    await this.http.saveAs(fullUrl, fileFullPath);
                    result.status = "success";
                } catch (err) {
                    result.status = `error:${err.message}`;
                }
            }
        }
        return list;
    }
}