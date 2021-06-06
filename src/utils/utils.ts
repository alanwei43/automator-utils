/**
 * 阻塞等待
 * @param time number
 */
export async function wait<T>(time?: number): Promise<void> {
    if (typeof time === "number" && time > 0) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), time);
        });
    }
    return Promise.resolve();
}

/**
 * 是否为简单对象
 * @param obj 
 */
export function isPlainObject(obj: any): boolean {
    return (obj + "") === "[object Object]";
}

export function jsonClone<T>(t: T): T {
    if (t === null || t === undefined) {
        return t;
    }
    return JSON.parse(JSON.stringify(t));
}
/**
 * 深度clone简单对象
 * @param target 目标对象
 * @param args 待合并对象列表
 * @returns
 */
export function deepClonePlainObject<T>(target: any, source: any): T {
    const clonedTarged = jsonClone(target);
    if (!isPlainObject(clonedTarged) || !isPlainObject(source)) {
        return clonedTarged;
    }

    return (function clone(t, s) {
        for (let key of Object.keys(s)) {
            const targetVal = t[key];
            const sourceVal = s[key];
            if (targetVal === sourceVal) {
                continue;
            }
            if (sourceVal === null || sourceVal === undefined) {
                continue;
            }

            if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
                clone(targetVal, sourceVal);
                continue;
            }
            t[key] = sourceVal;
        }
        return t;
    })(clonedTarged, jsonClone(source));
}