import path from "path";
import fs from "fs";
import os from "os";
import { ILocker } from "./ILocker";
import { hash, wait } from "../utils/index";

export class FileLocker implements ILocker {
  private dir: string
  private readonly waitMs: number = 1000;

  constructor(dir?: string) {
    this.dir = typeof dir === "string" && dir.length > 0 ? dir : os.tmpdir();
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir);
    }
  }

  private getLockFileFullPath(key: string): string {
    const fileName = hash(key);
    const lockFileFullPath = path.join(this.dir, fileName + ".lock");
    return lockFileFullPath;
  }
  unLock(key: string): void {
    const p = this.getLockFileFullPath(key);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }

  async tryLock(key: string): Promise<boolean> {
    const random = [key, Math.random().toString(16).split(".")[1], Date.now().toString(16), process.pid.toString(16)].join("-");
    const lockFileFullPath = this.getLockFileFullPath(key);

    if (fs.existsSync(lockFileFullPath)) {
      return false;
    }

    try {
      fs.writeFileSync(lockFileFullPath, random, { encoding: "utf-8" });
    } catch (err) {
      console.warn(`文件${lockFileFullPath}写入异常: `, err);
      return false;
    }

    await wait(this.waitMs);

    const fileContent: string = fs.readFileSync(lockFileFullPath, { encoding: "utf-8" });
    if (fileContent !== random) {
      return false;
    }

    return true;
  }
}