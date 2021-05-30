import fs from "fs";
import path from "path";

export function copyFile(from: string, to: string, filter: (fullPath: string) => boolean) {
    (function recursive(dir, dest) {
        fs.readdirSync(dir)
            .map(name => ({
                fullPath: path.join(dir, name),
                stat: fs.statSync(path.join(dir, name)),
                destPath: path.join(dest, name),
            }))
            .forEach(info => {
                if (info.stat.isDirectory()) {
                    copyFile(info.fullPath, info.destPath, filter);
                    return;
                }
                if (filter(info.fullPath)) {
                    console.log(`拷贝文件: ${info.fullPath} -> ${info.destPath}`);
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