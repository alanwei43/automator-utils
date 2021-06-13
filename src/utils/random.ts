/**
 * 获取指定范围内的随机数(整数)
 * @param {number} min 最小值(包含)
 * @param {number} max 最大值(不包含)
 * @returns {number}
 * @see https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/math/random
 */
export function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * 获取指定范围内的随机数(小数)
 * @param {number} min 最小值(包含)
 * @param {number} max 最大值(不包含)
 * @returns {number}
 * @see https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/math/random
 */
export function getRandomArbitrary(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * 返回随机字符串
 */
export function getRandomStr(): string {
    const p1 = Date.now().toString(16);
    const p2 = Math.random().toString(16).split(".")[1];
    return `${p1}-${p2}`;
}