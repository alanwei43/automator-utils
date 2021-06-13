import { ChildProcess, fork, ForkOptions } from "child_process";
import { getRandomStr } from "./index";

/**
 * 请求调用方法
 */
interface InvokeMethod {
  type: "invoke"
  id: string

  method: string
  args: Array<any>
}

/**
 * 方法响应结果
 */
interface MethodResult {
  type: "result"
  id: string

  result: any
  error: string
}

/**
 * fork创建子线程并调用子线程方法
 * @param forkOpts 
 * @param proxyOpts 
 */
export function invokeChildThreadMethods<T>(
  forkOpts: { module: string, args?: Array<string>, options?: ForkOptions },
  proxyOpts?: InvokeProxyOptions
): { invoke: T, thread: ChildProcess } {
  const cp: ChildProcess = fork(forkOpts.module, forkOpts.args, forkOpts.options);
  return {
    invoke: proxyOtherThreadMethods(cp, proxyOpts || {}),
    thread: cp
  };
}

export type InvokeProxyOptions = {
  /**
   * 调用等待超时时间
   */
  timeout?: number
  json?: boolean
}

const INVOKE_ID_PREFIX = `invoke-`;

function isInvalidId(id: string): boolean {
  return typeof id !== "string" || !id.startsWith(INVOKE_ID_PREFIX);
}

/**
 * 代理其他线程暴露的方法(通过 exposeMethodsToOtherThread 方法暴露), 需要注意的是最终代理的方法都是异步的, 返回的是个Promise
 * @param thread 其他线程对象: 如果自身是子线程, 需要代理调用父线程方法, 传Node全局对象 process; 如果自身是父线程, 需要代理调用子线程方法, 传子线程对象.
 * @param proxyOpts 代理选项
 */
export function proxyOtherThreadMethods<T>(
  thread: NodeJS.Process | ChildProcess,
  proxyOpts: InvokeProxyOptions
): T {
  const invokeCallbacks: Map<string, { resolve: Function, reject: Function }> = new Map();

  /**
   * 接收方法返回结果
   */
  thread.on("message", function (rawResponse: string | MethodResult) {
    const result: MethodResult = typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;
    if (isInvalidId(result.id)) {
      console.warn(`result id(${result.id}) is not a string`);
      return;
    }
    if (result.type !== "result") {
      return;
    }

    if (invokeCallbacks.has(result.id)) {
      const callback = invokeCallbacks.get(result.id);
      invokeCallbacks.delete(result.id);
      result.error ? callback.reject(new Error(result.error)) : callback.resolve(result.result);
    } else {
      console.warn(`${result.id} not found callback`);
    }
  });

  const ThreadStatus = {
    pid: thread.pid,
    exitCode: undefined,
    exitSignal: ""
  }
  thread.on("exit", function (number, signal) {
    ThreadStatus.exitCode = number;
    ThreadStatus.exitSignal = signal;
  });

  /**
   * 返回一个代理对象, 处理用户的方法调用请求
   */
  const instance = {};
  const proxy = new Proxy(instance, {
    apply(target, thisArg, args) {
      throw new Error("不支持new实例化");
    },
    get(target, property, receiver) {

      const id = INVOKE_ID_PREFIX + getRandomStr();
      return function (...args: any[]) {

        const invoke: InvokeMethod = {
          type: "invoke",
          method: String(property),
          id: id,
          args: args
        };

        return new Promise((resolve, reject) => {
          if (typeof ThreadStatus.exitCode === "number") {
            reject(new Error(`process(${ThreadStatus.pid}) has exit, code: ${ThreadStatus.exitCode}, signal: ${ThreadStatus.exitSignal}`));
            return;
          }
          const sendData = proxyOpts.json === false ? invoke : JSON.stringify(invoke);
          console.log(sendData);
          thread.send(sendData, err => {
            err && reject(err);
          });
          invokeCallbacks.set(id, {
            resolve: (data: any) => resolve(data),
            reject: (err: Error) => reject(err)
          });
          if (typeof proxyOpts.timeout === "number") {
            /**
             * 如果用户设置了超时
             */
            setTimeout(() => {
              invokeCallbacks.delete(id);
              reject(new Error("time out"));
            }, proxyOpts.timeout);
          }
        });
      }
    }
  });
  return proxy as T;
}


/**
 * 暴露方法给其他线程(子线程或者父线程)
 * @param methods 方法列表(一般是class实例)
 * @param thread 线程对象: 如果自身是子线程, 暴露方法给父线程, 传Node全局对象process; 如果自身是父线程，暴露方法给子线程, 传子线程对象.
 * @param options 
 */
export function exposeMethodsToOtherThread<T>(methods: T, thread: NodeJS.Process | ChildProcess, options: { context?: any } = {}): void {
  thread.on("message", function (rawRequest: string | InvokeMethod) {
    /**
     * 接收父线程发送的方法调用请求
     */
    const isJsonFormat = typeof rawRequest === "string";
    const invoke: InvokeMethod = isJsonFormat ? JSON.parse(rawRequest + "") : rawRequest;
    if (isInvalidId(invoke.id)) {
      console.warn(`invalid invoke id: ${invoke.id}`);
      return;
    }
    if (invoke.type !== "invoke") {
      // console.warn(`invalid invoke type: ${invoke.type}`);
      return;
    }

    const fn: Function = methods[invoke.method];
    if (typeof fn !== "function") {
      console.log(`${invoke.method} is not a function`);
      const response: MethodResult = {
        type: "result",
        id: invoke.id,
        result: undefined,
        error: `${invoke.method} is not a function`
      }
      thread.send(isJsonFormat ? JSON.stringify(response) : response);
      return;
    }

    /**
     * 执行方法调用并返回给发起调用请求的线程
     */
    const result = fn.apply(options.context || methods, invoke.args);
    Promise.resolve(result).then(data => {
      const result: MethodResult = {
        type: "result",
        id: invoke.id,
        result: data,
        error: undefined
      };
      /**
       * 将方法执行结果返回给发起调用请求的线程
       */
      thread.send(isJsonFormat ? JSON.stringify(result) : result);
    });
  });
}