import crypto from "crypto";
/**
 * 计算hash值
 * @param str string
 * @returns {string}
 */
export function hash(str: string): string {
    return crypto.createHash("sha256").update(str).digest("hex");
}