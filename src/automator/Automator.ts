import fs from "fs";
import path from "path";
import { OnionCompose, readYamlConfig } from "../index";
import { YamlConfig, YamlActionStepConfig, StepMiddleware, StepMiddlewareCtor, StepMiddlewareUtil } from "./index";

type OnionComposeGetter = (cmd: any, utils?: StepMiddlewareUtil) => OnionCompose<StepMiddlewareUtil, StepMiddleware>

export type AutomatorCtor = {
    /**
     * 模块根目录
     */
    modulesRootDir: Array<string>
}
export class Automator {
    private readonly MiddlewareModules: Map<string, () => StepMiddleware>
    private readonly _ctor: AutomatorCtor
    constructor(ctor: AutomatorCtor) {
        this.MiddlewareModules = new Map();
        this._ctor = ctor;
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
                        const moduleRelDir = path.relative(root, path.dirname(info.fullPath))
                            .replace(/\\/g, "/") // 兼容Windows系统路径分隔符
                            .split("/")
                            .filter(p => p.length > 0) // 保证第一和最后一个字符不是 /
                            .join("/");

                        if (modules && typeof modules === "object") {
                            Object.keys(modules)
                                .map(key => modules[key])
                                .filter(m => typeof m === "function" && typeof m.name === "string" && m.name.length)
                                .map(mod => ({
                                    name: mod.name,
                                    ctor: mod
                                }))
                                .forEach(mod => {
                                    self.MiddlewareModules.set(self.getModuleId(root, info.fullPath, mod.name), mod.ctor)
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
        for (let dir of this._ctor.modulesRootDir) {
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

    public async getActionsByFile(configFilePath: string): Promise<Map<string, OnionComposeGetter>> {
        const config = readYamlConfig<YamlConfig>(configFilePath);
        if (!config) {
            console.log(`配置文件${configFilePath}读取失败`);
            return Promise.resolve(null);
        }
        return this.getActions(config);
    }

    public async getActions(config: YamlConfig): Promise<Map<string, OnionComposeGetter>> {
        const modules: Map<string, OnionComposeGetter> = new Map();
        for (let action of config.actions) {
            modules.set(action.name, (cmd: any, utils: StepMiddlewareUtil) => {
                const compose = new OnionCompose<StepMiddlewareUtil, StepMiddleware>(utils);

                for (let stepNameOrObj of action.steps) {
                    const step: YamlActionStepConfig = typeof stepNameOrObj === "string" ? { id: stepNameOrObj } : stepNameOrObj;

                    const mw = this.MiddlewareModules.get(step.id);
                    if (!mw) {
                        console.warn(`[${config.name} ${action.name}] 中间件 ${step.id} 不存在`);
                        continue;
                    }

                    const ctor: StepMiddlewareCtor = {
                        config: config,
                        action: action,
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
