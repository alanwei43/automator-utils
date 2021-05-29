import fs from "fs";
import yaml from "js-yaml";

/**
 * 读取yml文件配置
 * @param configFile 文件地址
 */
export function readYamlConfig<T>(configFile: string): T {
    if (!fs.existsSync(configFile)) {
        return null;
    }
    const stat = fs.statSync(configFile);
    if (!stat.isFile()) {
        return null;
    }
    const fileContent = fs.readFileSync(configFile, { encoding: "utf-8" });
    const config: any = yaml.load(fileContent);
    return config;
}
