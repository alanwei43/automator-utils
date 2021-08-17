import fs from "fs";
import path from "path";
import { OnionCompose, readYamlConfig, IMap, BaseTypes } from "../index";
import { StepMiddleware, StepMiddlewareCtor, StepMiddlewareContext } from "./index";
export class Automator {
    private readonly _middlewareModules: Map<string, () => StepMiddleware>
    private readonly _middlewareRequirePaths: Set<string>

    constructor(private readonly ctor: AutomatorCtor) {
        this._middlewareModules = new Map();
        this._middlewareRequirePaths = new Set();
    }

    /**
     * 初始化指定目录下模块数据
     * @param root 模块根目录
     */
    private initDirModules(root: string) {
        if (!root || !fs.existsSync(root)) {
            throw new Error(`[initDirModules] ${root} 目录不存在`);
        }

        const thisExtName = path.extname(__filename);
        const filterModule = this.ctor.moduleFilter || (f => path.extname(f) === thisExtName);
        const self = this;
        (function recursive(dir: string) {
            // 读取 dir 目录下目录及文件
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
                    // 读取到 info.fullPath 
                    if (info.stat.isFile() && filterModule(info.fullPath)) {
                        // 检测为JS模块文件, 执行require
                        const modules = require(info.fullPath);

                        if (modules && typeof modules === "object") {
                            // 检测到模块导出对象为object类型, 添加到模块路径
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
                                    // 读取到模块: mod.name, id 为: moduleId
                                    self._middlewareModules.set(moduleId, mod.ctor)
                                });
                        }
                    }
                    if (info.stat.isDirectory()) {
                        // 检测为目录, 递归该目录下文件
                        recursive(info.fullPath);
                    }
                });
        }).bind(this)(root);
    }
    /**
     * 刷新模块
     * @param cleanCache 是否强制刷新(清空node require缓存)
     */
    public refreshModules(cleanCache: boolean) {
        if (cleanCache) {
            for (let p of this._middlewareRequirePaths) {
                // 删除模块缓存
                delete require.cache[p];
            }
        }
        for (let dir of this.ctor.modulesRootDir) {
            // 加载目录下模块
            this.initDirModules(dir);
        }
    }
    /**
     * 获取模块id
     * @param rootDir 模块根目录(用于计算模块相对路径)
     * @param moduleFullPath 模块完整路径
     * @param moduleName 模块名称
     */
    private getModuleId(rootDir: string, moduleFullPath: string, moduleName: string): string {
        const moduleRelDir = path.relative(rootDir, path.dirname(moduleFullPath));
        const moduleTempId = `${moduleRelDir}/${moduleName}`;
        const moduleId = moduleTempId.replace(/\\/g, "/") // 兼容Windows系统路径分隔符
            .split("/")
            .filter(p => p.length > 0) // 保证第一和最后一个字符不是 /
            .join("/");

        return "/" + moduleId;
    }

    /**
     * 获取特定作业
     * @param config 包含所有作业的配置信息
     * @param jobName 作业名称
     * @param jobData 作业数据
     */
    public getJob(config: AutomatorConfig, jobName: string, jobData: JobData, continueNextJob?: boolean): OnionCompose<StepMiddlewareContext, StepMiddleware> {
        if (!Array.isArray(config.jobs)) {
            throw new Error(`[config: ${config.name}] jobs 必须是数组`);
        }
        // 开始根据配置组装job
        for (let job of config.jobs) {
            if (job.name !== jobName) {
                continue;
            }
            const compose = new OnionCompose<StepMiddlewareContext, StepMiddleware>(jobData.context);
            if (!Array.isArray(job.steps)) {
                throw new Error(`[config: ${config.name}, job: ${job.name}] steps 必须是数组`);
            }

            // 组建 step
            for (let stepNameOrObj of job.steps) {
                const step: AutomatorStepConfig = typeof stepNameOrObj === "string" ? { id: stepNameOrObj } : stepNameOrObj;

                const mw = this._middlewareModules.get(step.id);
                if (!mw) {
                    console.warn(`${job.name} 下的 step ${step.id} 不存在`);
                    continue;
                }

                const ctor: StepMiddlewareCtor = {
                    config: config,
                    job: job,
                    step: step,
                    cmd: jobData.stepCmd
                };
                let instance: StepMiddleware;
                try {
                    instance = Reflect.construct(mw, [ctor]);
                } catch (err) {
                    console.warn(`[config: ${config.name}, job: ${job.name}, step: ${step.id}] 初始化 ${mw.name} 发生异常`);
                    continue;
                }
                if (typeof instance.execute !== "function") {
                    console.warn(`[config: ${config.name}, job: ${job.name}, step: ${step.id}] ${mw.name}.execute 不是函数类型`);
                    continue;
                }
                compose.use(instance);
            }

            if (continueNextJob && job.next) {
                /**
                 * 如果继续查找配置的next job，而且当前job配置了next
                 */
                const nextJob = this.getJob(config, job.next, jobData, continueNextJob);
                compose.updateNext(nextJob);
            }

            return compose;
        }
        throw new Error(`${config.jobs.map(j => j.name).join(", ")} 找不到 ${jobName}`);
    }
    /**
     * 根据配置文件获取job列表
     * @param configFilePath ymal配置文件路径
     * @param jobsData 作业数据
     */
    public getJobByFile(configFilePath: string, jobName: string, jobData: JobData): OnionCompose<StepMiddlewareContext, StepMiddleware> {
        const config = readYamlConfig<AutomatorConfig>(configFilePath);
        if (!config) {
            throw new Error(`配置文件${configFilePath}读取失败`);
        }
        return this.getJob(config, jobName, jobData, true);
    }
    /**
     * 根据配置文件获取job列表
     * @param configFilePath ymal配置文件路径
     * @param jobsData 作业数据
     */
    public getJobsByFile(configFilePath: string, jobsData: JobsData): Map<string, OnionCompose<StepMiddlewareContext, StepMiddleware>> {
        const config = readYamlConfig<AutomatorConfig>(configFilePath);
        if (!config) {
            throw new Error(`配置文件${configFilePath}读取失败`);
        }
        return this.getJobs(config, jobsData);
    }

    /**
     * 获取作业列表
     * @param config 
     * @param jobsData 
     */
    public getJobs(config: AutomatorConfig, jobsData: JobsData): Map<string, OnionCompose<StepMiddlewareContext, StepMiddleware>> {
        const jobMaps: Map<string, OnionCompose<StepMiddlewareContext, StepMiddleware>> = new Map();
        if (!Array.isArray(config.jobs)) {
            throw new Error(`[config: ${config.name}] jobs 必须是数组`);
        }
        // 开始根据配置组装job
        for (let job of config.jobs) {
            const jobData = jobsData[job.name];
            const compose = this.getJob(config, job.name, jobData, true)
            jobMaps.set(job.name, compose);
        }

        return jobMaps;
    }
}

// export type OnionComposeGetter = (cmd: any, context?: StepMiddlewareContext) => OnionCompose<StepMiddlewareContext, StepMiddleware>

export interface AutomatorCtor {
    /**
     * 模块根目录
     */
    modulesRootDir: Array<string>
    /**
     * 模块文件过滤
     */
    moduleFilter?(fileName: string): boolean
}

export type JobsData = {
    [key: string]: JobData
}
export interface JobData {
    /**
     * step中间件的构造函数里的 cmd
     */
    stepCmd: any
    /**
     * step中间件的context
     */
    context?: StepMiddlewareContext
}

export interface AutomatorConfig extends IMap<BaseTypes | Array<AutomatorJobConfig>> {
    /**
     * 当前配置名称
     */
    name: string
    desc?: string
    /**
     * 可以有多个jobs
     */
    jobs: Array<AutomatorJobConfig>
}


export interface AutomatorJobConfig extends IMap<BaseTypes | Array<AutomatorStepConfig | string>> {
    /**
     * 作业名称
     */
    name: string
    desc?: string
    /**
     * 当前job关联的step
     */
    steps: Array<AutomatorStepConfig | string>
    /**
     * 当前job执行完, 需要执行的下一个job
     */
    next?: string
}


export interface AutomatorStepConfig extends IMap<BaseTypes> {
    /**
     * step的id
     */
    id: string
}
