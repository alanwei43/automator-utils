import fs from "fs";
import path from "path";
import { OnionCompose } from "src/onion";
import { readYamlConfig } from "../utils";
import { YamlConfig, YamlActionStepConfig, StepMiddleware, StepMiddlewareCtor, CommanderType, StepMiddlewareUtil } from "./index";

type OnionComposeGetter = (cmd: StepMiddlewareCtor["cmd"], utils?: StepMiddlewareUtil) => OnionCompose<StepMiddlewareUtil, StepMiddleware>

export type AutomatorCtor = {
    /**
     * 模块根目录
     */
    modulesRootDir: string
}
export class Automator {
    private readonly MiddlewareModules: Map<string, () => StepMiddleware>
    private readonly _ctor: AutomatorCtor
    constructor(ctor: AutomatorCtor) {
        this.MiddlewareModules = new Map();
        this._ctor = ctor;
        this.initDirModules();
    }

    private initDirModules() {
        const root = this._ctor.modulesRootDir;
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
                        const moduleRelDir = path.relative(root, path.dirname(info.fullPath));
                        if (modules && typeof modules === "object") {
                            Object.keys(modules)
                                .map(key => modules[key])
                                .filter(m => typeof m === "function" && typeof m.name === "string" && m.name.length)
                                .map(mod => ({
                                    name: mod.name,
                                    ctor: mod
                                }))
                                .forEach(mod => {
                                    self.MiddlewareModules.set(`${moduleRelDir}/${mod.name}`, mod.ctor)
                                });
                        }
                    }
                    if (info.stat.isDirectory()) {
                        recursive(info.fullPath);
                    }
                });
        })(root);
    }

    public async getActions(configFilePath: string): Promise<Map<string, OnionComposeGetter>> {
        const config = readYamlConfig<YamlConfig>(configFilePath);
        if (!config) {
            console.log(`配置文件${configFilePath}读取失败`);
            return;
        }

        const modules: Map<string, OnionComposeGetter> = new Map();
        for (let action of config.actions) {
            modules.set(action.name, (cmd: CommanderType, utils: StepMiddlewareUtil) => {
                const compose = new OnionCompose<StepMiddlewareUtil, StepMiddleware>(utils);

                for (let stepNameOrObj of action.steps) {
                    const step: YamlActionStepConfig = typeof stepNameOrObj === "string" ? { name: stepNameOrObj } : stepNameOrObj;

                    const mw = this.MiddlewareModules.get(step.name);
                    if (!mw) {
                        console.warn(`[${config.name} ${action.name}] 中间件 ${step.name} 不存在`);
                        continue;
                    }

                    const ctor: StepMiddlewareCtor = {
                        config: config,
                        action: action,
                        step: step,
                        cmd: cmd || { jobId: null }
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
