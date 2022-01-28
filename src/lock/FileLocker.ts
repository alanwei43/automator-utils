import path from "path";
import fs from "fs";
import os from "os";
import { ILocker } from "./ILocker";
import { hash, wait } from "../utils/index";

export class FileLocker implements ILocker {
  private _dir: string
  private readonly _waitMs: number = 1000;
  private readonly _params: FileLockerParams

  constructor(params: FileLockerParams) {
    this._params = params;
    this._dir = typeof params.dir === "string" && params.dir.length > 0 ? params.dir : os.tmpdir();
    if (!fs.existsSync(this._dir)) {
      fs.mkdirSync(this._dir);
    }
  }

  private getLockFileFullPath(key: string): string {
    const fileName = hash(key);
    const lockFileFullPath = path.join(this._dir, `${this._params.fileNamePrefix || "file"}-${fileName}.lock`);
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

    await wait(this._waitMs);

    const fileContent: string = fs.readFileSync(lockFileFullPath, { encoding: "utf-8" });
    if (fileContent !== random) {
      return false;
    }

    return true;
  }
}

export type FileLockerParams = {
  dir?: string
  fileNamePrefix?: string
}