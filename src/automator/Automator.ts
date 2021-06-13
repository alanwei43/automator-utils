import fs from "fs";
import path from "path";
import { OnionCompose, readYamlConfig, ILogger } from "../index";
import { AutomatorConfig, AutomatorStepConfig, StepMiddleware, StepMiddlewareCtor, StepMiddlewareUtil } from "./index";

export type OnionComposeGetter = (cmd: any, utils?: StepMiddlewareUtil) => OnionCompose<StepMiddlewareUtil, StepMiddleware>

export type AutomatorCtor = {
    /**
     * 模块根目录
     */
    modulesRootDir: Array<string>
    /**
     * 模块文件过滤
     */
    moduleFilter?: (fileName: string) => boolean
    logger: ILogger
}
export class Automator {
    private readonly _middlewareModules: Map<string, () => StepMiddleware>
    private readonly _middlewareRequirePaths: Set<string>

    constructor(private ctor: AutomatorCtor) {
        this._middlewareModules = new Map();
        this._middlewareRequirePaths = new Set();
    }

    private initDirModules(root: string) {
        if (!root || !fs.existsSync(root)) {
            this.ctor.logger.warn(`${root} 目录不存在`);
            this._middlewareModules.clear();
            return;
        }

        const thisExtName = path.extname(__filename);
        const filterModule = this.ctor.moduleFilter || (f => path.extname(f) === thisExtName);
        const self = this;
        (function recursive(dir) {
            self.ctor.logger.debug(`读取 ${dir} 目录下目录及文件`);
            fs.readdirSync(dir)
                .map(child => ({
                    name: child,
                    fullPath: path.join(dir, child)
                }))
                .map(info => ({
                    ...info,
                    extName: path.extname(info.name),
                    stat: fs.statSync(info.fullPath)
                }))
                .forEach(info => {
                    self.ctor.logger.debug(`读取到 ${info.fullPath}`);
                    if (info.stat.isFile() && filterModule(info.fullPath)) {
                        self.ctor.logger.debug(`检测为JS模块文件, 执行require`);
                        const modules = require(info.fullPath);

                        if (modules && typeof modules === "object") {
                            self.ctor.logger.debug(`检测到模块导出对象为object类型, 添加到模块路径`);
                            self._middlewareRequirePaths.add(info.fullPath);

                            Object.keys(modules)
                                .map(key => modules[key])
                                .filter(m => typeof m === "function" && typeof m.name === "string" && m.name.length)
                                .map(mod => ({
                                    name: mod.name,
                                    ctor: mod
                                }))
                                .forEach(mod => {
                                    const moduleId = self.getModuleId(root, info.fullPath, mod.name);
                                    self.ctor.logger.debug(`读取到模块: ${mod.name}, id 为: ${moduleId}`);
                                    self._middlewareModules.set(moduleId, mod.ctor)
                                });
                        }
                    }
                    if (info.stat.isDirectory()) {
                        self.ctor.logger.debug(`检测为目录, 递归该目录下文件`);
                        recursive(info.fullPath);
                    }
                });
        }).bind(this)(root);
    }
    public refreshModules(cleanCache: boolean) {
        this.ctor.logger.debug(`刷新模块`);
        if (cleanCache) {
            for (let p of this._middlewareRequirePaths) {
                this.ctor.logger.debug(`删除模块缓存, 模块地址: ${p}`);
                delete require.cache[p];
            }
        }
        for (let dir of this.ctor.modulesRootDir) {
            this.ctor.logger.debug(`加载目录(${dir})下模块`);
            this.initDirModules(dir);
            this.ctor.logger.debug(`目录(${dir})下模块加载完成`);
        }
    }
    private getModuleId(rootDir: string, moduleFullPath: string, moduleName: string): string {
        const moduleRelDir = path.relative(rootDir, path.dirname(moduleFullPath));
        const moduleTempId = `${moduleRelDir}/${moduleName}`;
        const moduleId = moduleTempId.replace(/\\/g, "/") // 兼容Windows系统路径分隔符
            .split("/")
            .filter(p => p.length > 0) // 保证第一和最后一个字符不是 /
            .join("/");

        return "/" + moduleId;
    }

    public async getJobsByFile(configFilePath: string): Promise<Map<string, OnionComposeGetter>> {
        const config = readYamlConfig<AutomatorConfig>(configFilePath);
        if (!config) {
            this.ctor.logger.error(`配置文件${configFilePath}读取失败`);
            return Promise.reject(new Error(`配置文件${configFilePath}读取失败`));
        }
        return this.getJobs(config);
    }

    public async getJobs(config: AutomatorConfig): Promise<Map<string, OnionComposeGetter>> {
        const modules: Map<string, OnionComposeGetter> = new Map();
        if (!Array.isArray(config.jobs)) {
            throw new Error(`[config: ${config.name}] jobs 必须是数组`);
        }
        this.ctor.logger.debug(`根据配置组装job, 配置为: ${JSON.stringify(config)}`);
        for (let job of config.jobs) {
            const logKey = [`job:${job.name}`];
            this.ctor.logger.debug(`${logKey.join(" ")} 设置job`);
            modules.set(job.name, (cmd: any, utils: StepMiddlewareUtil) => {
                const compose = new OnionCompose<StepMiddlewareUtil, StepMiddleware>(utils);

                if (!Array.isArray(job.steps)) {
                    throw new Error(`[config: ${config.name}, job: ${job.name}] steps 必须是数组`);
                }
                this.ctor.logger.debug(`[${logKey.join(" ")}] 共 ${job.steps} 个step`);
                for (let stepNameOrObj of job.steps) {
                    const step: AutomatorStepConfig = typeof stepNameOrObj === "string" ? { id: stepNameOrObj } : stepNameOrObj;
                    logKey.push(`step:${step.id}`);

                    const mw = this._middlewareModules.get(step.id);
                    if (!mw) {
                        console.warn(`step ${step.id} 不存在`);
                        this.ctor.logger.error(`[${logKey.join(" ")}] step不存在`);
                        continue;
                    }

                    this.ctor.logger.error(`[${logKey.join(" ")}] step获取成功`);

                    const ctor: StepMiddlewareCtor = {
                        config: config,
                        job: job,
                        step: step,
                        cmd: cmd
                    };
                    const instance: StepMiddleware = Reflect.construct(mw, [ctor]);

                    this.ctor.logger.debug(`[${logKey.join(" ")}] step实例化成功`);
                    compose.use(instance);
                    logKey.pop();
                }
                this.ctor.logger.debug(`[${logKey.join(" ")}] compose组装完成并返回`);
                return compose;
            });
        }
        return modules;
    }
}
