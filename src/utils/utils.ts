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