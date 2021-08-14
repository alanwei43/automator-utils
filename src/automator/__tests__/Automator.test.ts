import path from "path";
import { AutomatorStepConfig, AutomatorConfig, Automator, AutomatorJobConfig } from "../../index";

test("自动化脚本 基于代码配置", async () => {
    const auto = new Automator({
        "modulesRootDir": [path.join(__dirname, "modules")],
        "moduleFilter": f => f.endsWith(".js") || f.endsWith(".ts"),
    });
    auto.refreshModules(false);
    const steps: Array<AutomatorStepConfig | string> = [{
        "id": "/RootModule",
        "hello": ["world"],
    }, "/share/ShareModule"];
    const job: AutomatorJobConfig = {
        "name": "action-1",
        "steps": steps
    };
    const config: AutomatorConfig = {
        "name": "jack",
        "jobs": [job]
    };
    const all = auto.getJobs(config, {
        "action-1": {
            stepCmd: {
                map: (letter: string) => letter.toUpperCase()
            },
        }
    });
    const compose = all.get("action-1");

    const result = await compose.run();
    expect(result).toBe("ALAN WEI");
});

test("自动化脚本 基于配置文件", async () => {
    const auto = new Automator({
        "modulesRootDir": [path.join(__dirname, "modules")],
        "moduleFilter": f => f.endsWith(".js") || f.endsWith(".ts"),
    });
    auto.refreshModules(false);
    const all = auto.getJobsByFile(path.join(__dirname, "modules", "config.yml"), {
        "action-1": {
            stepCmd: {
                map: (letter: string) => letter.toUpperCase()
            },
        }
    });
    const compose = all.get("action-1");
    const result = await compose.run();
    expect(result).toBe("ALAN WEI");
});

/**
 * util 正确传递
 * compose.run(...) 正确传递
 */