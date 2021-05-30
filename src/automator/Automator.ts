import fs from "fs";
import path from "path";
import { OnionCompose, readYamlConfig } from "../index";
import { AutomatorConfig, AutomatorStepConfig, StepMiddleware, StepMiddlewareCtor, StepMiddlewareUtil } from "./index";

type OnionComposeGetter = (cmd: any, utils?: StepMiddlewareUtil) => OnionCompose<StepMiddlewareUtil, StepMiddleware>

export type AutomatorCtor = {
    /**
     * 模块根目录
     */
    modulesRootDir: Array<string>
}
export class Automator {
    private readonly MiddlewareModules: Map<string, () => StepMiddleware>
    constructor(private ctor: AutomatorCtor) {
        this.MiddlewareModules = new Map();
        this.refreshModules();
    }

    private initDirModules(root: string) {
        if (!root || !fs.existsSync(root)) {
            this.MiddlewareModules.clear();
            return;
        }

        const self = this;
        (function recursive(dir) {
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
                    if (info.stat.isFile() && (info.extName === ".js" || info.extName === ".ts")) {
                        const modules = require(info.fullPath);

                        if (modules && typeof modules === "object") {
                            Object.keys(modules)
                                .map(key => modules[key])
                                .filter(m => typeof m === "function" && typeof m.name === "string" && m.name.length)
                                .map(mod => ({
                                    name: mod.name,
                                    ctor: mod
                                }))
                                .forEach(mod => {
                                    const moduleId = self.getModuleId(root, info.fullPath, mod.name);
                                    self.MiddlewareModules.set(moduleId, mod.ctor)
                                });
                        }
                    }
                    if (info.stat.isDirectory()) {
                        recursive(info.fullPath);
                    }
                });
        })(root);
    }
    public refreshModules() {
        for (let dir of this.ctor.modulesRootDir) {
            this.initDirModules(dir);
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
            console.log(`配置文件${configFilePath}读取失败`);
            return Promise.resolve(null);
        }
        return this.getJobs(config);
    }

    public async getJobs(config: AutomatorConfig): Promise<Map<string, OnionComposeGetter>> {
        const modules: Map<string, OnionComposeGetter> = new Map();
        if (!Array.isArray(config.jobs)) {
            throw new Error(`[config: ${config.name}] jobs 必须是数组`);
        }
        for (let job of config.jobs) {
            modules.set(job.name, (cmd: any, utils: StepMiddlewareUtil) => {
                const compose = new OnionCompose<StepMiddlewareUtil, StepMiddleware>(utils);

                if (!Array.isArray(job.steps)) {
                    throw new Error(`[config: ${config.name}, job: ${job.name}] steps 必须是数组`);
                }
                for (let stepNameOrObj of job.steps) {
                    const step: AutomatorStepConfig = typeof stepNameOrObj === "string" ? { id: stepNameOrObj } : stepNameOrObj;

                    const mw = this.MiddlewareModules.get(step.id);
                    if (!mw) {
                        console.warn(`[${config.name} ${job.name}] step ${step.id} 不存在`);
                        continue;
                    }

                    const ctor: StepMiddlewareCtor = {
                        config: config,
                        job: job,
                        step: step,
                        cmd: cmd
                    };
                    const instance: StepMiddleware = Reflect.construct(mw, [ctor]);

                    compose.use(instance);
                }
                return compose;
            });
        }
        return modules;
    }
}
