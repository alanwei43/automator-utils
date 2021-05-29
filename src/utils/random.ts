/**
 * 获取指定范围内的随机数(整数)
 * @param {number} min 最小值(包含)
 * @param {number} max 最大值(不包含)
 * @returns {number}
 * @see https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/math/random
 */
export function getRandomInt(min, max) {
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
export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}