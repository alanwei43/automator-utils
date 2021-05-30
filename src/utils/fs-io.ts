import fs from "fs";
import path from "path";

/**
 * 拷贝文件
 * @param from 源目录
 * @param to 目标目录
 * @param filter 过滤
 */
export function copyFiles(from: string, to: string, filter: (fullPath: string) => boolean) {
    (function recursive(dir, dest) {
        fs.readdirSync(dir)
            .map(name => ({
                fullPath: path.join(dir, name),
                stat: fs.statSync(path.join(dir, name)),
                destPath: path.join(dest, name),
            }))
            .forEach(info => {
                if (info.stat.isDirectory()) {
                    copyFiles(info.fullPath, info.destPath, filter);
                    return;
                }
                if (filter(info.fullPath)) {
                    const destDir = path.dirname(info.destPath);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, {
                            recursive: true
                        });
                    }
                    fs.createReadStream(info.fullPath).pipe(fs.createWriteStream(info.destPath));
                }
            })
    })(from, to);
}